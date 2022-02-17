import ytdl, { Chapter, chooseFormatOptions, videoInfo } from 'ytdl-core'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import getArtistTitle from 'get-artist-title'

export interface SuperSplitterOptions {
  url: string
}

export interface ExtendedChapter extends Chapter {
    end_time?: number
}

export class SuperSplitter {
  private readonly options: SuperSplitterOptions
  private video: videoInfo

  constructor (options: SuperSplitterOptions) {
    this.options = options
  }

  public async init (url: string): Promise<void> {
    this.video = await ytdl.getInfo(url)
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

  public async download (artist: string, album: string, output: string, quality: chooseFormatOptions['quality'], format?: string): Promise<void> {
    const folderPath = path.resolve(path.join(output, `${artist} - ${album}`))

    if (!fs.existsSync(folderPath)) {
      fs.mkdirSync(folderPath, { recursive: true })
    }

    const tempFilePath = path.join(folderPath, 'temp.mp4')

    const chapters = SuperSplitter.addChapterEndTimes(Number(this.video.videoDetails.lengthSeconds), this.video.videoDetails.chapters)

    const downloadVideo = async (url, path): Promise<void> => {
      return new Promise((resolve, reject) => {
        const video = ytdl(url, {
          quality: quality || 'highestaudio'
        })
          .on('error', reject)

        video.pipe(fs.createWriteStream(tempFilePath))

        video.on('finish', () => {
          resolve()
        })
      })
    }

    await downloadVideo(this.options.url, tempFilePath)

    await Promise.allSettled(chapters.map(async (chapter, index) => {
      return new Promise<void>((resolve, reject) => {
        ffmpeg(tempFilePath).outputOptions([
          '-vn',
          '-i', tempFilePath,
          '-ss', String(chapter.start_time),
          '-t', String(chapter.end_time - chapter.start_time)
        ]).on('error', err => {
          reject(err)
        }).pipe(fs.createWriteStream(path.join(folderPath, `${SuperSplitter.formatTrackName(format, artist, album, index, chapter.title)}.mp3`)))
          .on('end', () => {
            resolve()
          })
      })
    }))

    fs.unlinkSync(tempFilePath)
  }

  private static formatTrackName (format: string, artist: string, album: string, track: number, title: string): string {
    if (!format) {
      return `${track + 1} - ${title}`
    }

    return format
      .replace('%artist%', artist)
      .replace('%album%', album)
      .replace('%track%', String(track + 1))
      .replace('%title%', title)
  }
}
