import ytdl, { Chapter, videoInfo } from 'ytdl-core'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import getArtistTitle from 'get-artist-title'
import NodeID3 from 'node-id3'

export interface SuperSplitterOptions {
  output: string;
  id3?: boolean;
  url: string;
  quality?: string
  format?: string
}

export interface ExtendedChapter extends Chapter {
    end_time?: number
}

export class SuperSplitter {
  readonly options: SuperSplitterOptions
  private video: videoInfo

  constructor (options: SuperSplitterOptions) {
    this.options = options
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
        quality: quality || 'highestaudio'
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

    const tempFilePath = path.join(folderPath, 'temp.mp4')

    const videoChapters = this.video.videoDetails.chapters

    let extractedChapters = []

    if (videoChapters) {
      extractedChapters = videoChapters
    }

    if (!extractedChapters.length) {
      extractedChapters = [{
        start_time: 0,
        title: album
      }]
    }

    const chapters = SuperSplitter.addChapterEndTimes(Number(this.video.videoDetails.lengthSeconds), extractedChapters)

    await this.downloadVideo(this.options.quality, tempFilePath)

    await Promise.allSettled(chapters.map(async (chapter, index) => {
      const chapterFilePath = path.join(folderPath, `${SuperSplitter.formatTrackName(this.options.format, artist, album, String(index + 1), chapter.title)}.mp3`)

      return new Promise<void>((resolve, reject) => {
        ffmpeg(tempFilePath).outputOptions([
          '-vn',
          '-i', tempFilePath,
          '-ss', String(chapter.start_time),
          '-t', String(chapter.end_time - chapter.start_time)
        ]).on('error', (err) => reject(err))
          .on('end', () => {
            SuperSplitter.addTags(chapterFilePath, this.options.url, artist, album, index + 1, chapter.title)

            resolve()
          })
          .saveToFile(chapterFilePath)
      })
    }))

    fs.unlinkSync(tempFilePath)
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
}
