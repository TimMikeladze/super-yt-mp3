import ytdl, { Chapter, videoInfo } from 'ytdl-core'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import getArtistTitle from 'get-artist-title'
import NodeID3 from 'node-id3'
import youtubeChapters from 'get-youtube-chapters'
import ytcm from '@freetube/yt-comment-scraper'
import fetch from 'isomorphic-fetch'

export interface SuperSplitterOptions {
  output: string;
  id3?: boolean;
  chapters?: boolean
  mp3?: boolean
  url: string;
  quality?: string
  format?: string
  keepVideo?: boolean
  art?: boolean
  batchSize?: number
}

export interface ExtendedChapter extends Chapter {
    end_time?: number
}

export const defaultOptions = {
  id3: true,
  chapters: true,
  mp3: true,
  keepVideo: false,
  art: true,
  batchSize: 2
}

export class SuperSplitter {
  readonly options: SuperSplitterOptions
  private video: videoInfo

  constructor (options: SuperSplitterOptions) {
    this.options = { ...defaultOptions, ...options }
  }

  public async init (): Promise<void> {
    this.video = await ytdl.getInfo(this.options.url)
  }

  public async getArtistTitle (): Promise<string> {
    const artistName = getArtistTitle(this.video.videoDetails.title)
    return artistName?.[0]
  }

  public async getAlbumTitle (): Promise<string> {
    const artistName = getArtistTitle(this.video.videoDetails.title)
    return artistName?.[1] || this.video.videoDetails.title
  }

  private static addChapterEndTimes (lengthSeconds: number, chapters: Chapter[]): ExtendedChapter[] {
    if (chapters.length === 1) {
      return [{
        ...chapters[0],
        end_time: lengthSeconds
      }]
    }
    return chapters.map((x, index) => {
      if (index === chapters.length - 1) {
        return {
          ...x,
          end_time: lengthSeconds
        }
      } else {
        return {
          ...x,
          end_time: chapters[index + 1].start_time
        }
      }
    })
  }

  private async downloadVideo (quality, path): Promise<void> {
    return new Promise((resolve, reject) => {
      const video = ytdl(this.options.url, {
        quality: this.options.mp3 ? (quality || 'highestaudio') : (quality || 'highestvideo')
      })
        .on('error', reject)

      video.pipe(fs.createWriteStream(path))

      video.on('finish', () => {
        resolve()
      })
    })
  }

  public async download (artist: string, album: string): Promise<void> {
    const folderPath = path.resolve(path.join(this.options.output, `${artist} - ${album}`))

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
    }

    const tempFilePath = path.join(folderPath, `${artist} - ${album}.mp4`)
    let chapters = []

    const thumbnail = this.video.videoDetails.thumbnails.sort((a, b) => b.width - a.width)?.[0]

    if (thumbnail && this.options.art && this.options.mp3) {
      await fetch(thumbnail.url)
        .then(res =>
          res.body.pipe(fs.createWriteStream(path.join(folderPath, 'cover.png')))
        )
    }

    if (this.options.chapters) {
      let extractedChapters = []

      const videoChapters = this.video.videoDetails.chapters
      const chaptersFromDescription = SuperSplitter.chaptersFromText(this.video.videoDetails.description)

      if (videoChapters) {
        extractedChapters = videoChapters
      } else if (chaptersFromDescription?.length) {
        extractedChapters = chaptersFromDescription
      }

      if (!chaptersFromDescription || !chaptersFromDescription?.length) {
        const { comments } = await ytcm.getComments({
          videoId: this.video.videoDetails.videoId
        })

        extractedChapters = comments.reduce((acc, comment) => {
          if (acc) {
            return acc
          }
          const chapters = SuperSplitter.chaptersFromText(comment.text)
          if (chapters?.length) {
            return chapters
          }
          return acc
        }, null)
      }

      if (!extractedChapters.length) {
        extractedChapters = [{
          start_time: 0,
          title: album
        }]
      }

      chapters = SuperSplitter.addChapterEndTimes(Number(this.video.videoDetails.lengthSeconds), extractedChapters)
    }

    await this.downloadVideo(this.options.quality, tempFilePath)

    if (this.options.chapters) {
      const promiseFns = chapters.map((chapter, index) => () => {
        const chapterFilePath = path.join(folderPath, `${SuperSplitter.formatTrackName(this.options.format, artist, album, String(index + 1), chapter.title)}.mp3`)

        return new Promise<void>((resolve, reject) => {
          ffmpeg(tempFilePath).outputOptions([
            this.options.mp3 ? '-vn' : null,
            '-i', tempFilePath,
            '-ss', String(chapter.start_time),
            '-t', String(chapter.end_time - chapter.start_time)
          ].filter(x => !!x)).on('error', (err) => reject(err))
            .on('end', () => {
              if (this.options.id3 && this.options.mp3) {
                SuperSplitter.addTags(chapterFilePath, this.options.url, artist, album, index + 1, chapter.title)
              }

              resolve()
            })
            .saveToFile(chapterFilePath)
        })
      })

      while (promiseFns.length) {
        await Promise.allSettled(promiseFns.splice(0, this.options.batchSize).map(f => f()))
      }
    }

    if (!this.options.keepVideo) {
      fs.unlinkSync(tempFilePath)
    }
  }

  private static formatTrackName (format: string, artist: string, album: string, track: string, title: string): string {
    if (!format) {
      return `${track} - ${title}`
    }

    return format
      .replace('%artist%', artist)
      .replace('%album%', album)
      .replace('%track%', track)
      .replace('%title%', title)
  }

  private static addTags (filepath: string, url: string, artist: string, album: string, trackNumber: number, title: string): true | Error {
    return NodeID3.write({
      artist,
      album,
      trackNumber: String(trackNumber),
      title,
      userDefinedUrl: [{
        description: 'Youtube URL',
        url
      }]
    }, filepath)
  }

  private static cleanTitle (title: string): string {
    title = title.trim()
    if (title.startsWith('- ')) {
      title = title.substring(2)
    }
    if (title.endsWith('-')) {
      title = title.substring(0, title.length - 1)
    }

    return title
  }

  private static chaptersFromText (text: string = ''): Chapter[] {
    try {
      return youtubeChapters(text.replace(/<br\s*\/?>/gi, '\n'), {
        extended: true
      }).map(x => ({
        start_time: x.start,
        title: SuperSplitter.cleanTitle(x.title)
      }))
    } catch (e) {
      return []
    }
  }
}
