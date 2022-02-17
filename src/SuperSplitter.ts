import ytdl, { Chapter, chooseFormatOptions } from 'ytdl-core'
import * as fs from 'fs'
import * as path from 'path'
import ffmpeg from 'fluent-ffmpeg'
import getArtistTitle from 'get-artist-title'

export interface SuperSplitterOptions {
}

export interface ExtendedChapter extends Chapter {
    end_time?: number
}

export const addChapterEndTimes = (lengthSeconds: number, chapters: Chapter[]): ExtendedChapter[] => {
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

export class SuperSplitter {
  private readonly options: SuperSplitterOptions

  constructor (options: SuperSplitterOptions) {
    this.options = options
  }

  public async download (url: string, output: string, quality: chooseFormatOptions['quality']): Promise<void> {
    const folderPath = path.resolve(output)
    const tempFilePath = path.join(folderPath, 'temp.mp4')

    const info = await ytdl.getInfo(url, {})

    const artistName = getArtistTitle(info.videoDetails.title)

    const chapters = addChapterEndTimes(Number(info.videoDetails.lengthSeconds), info.videoDetails.chapters)

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

    await downloadVideo(url, tempFilePath)

    await Promise.allSettled(chapters.map(async (chapter, index) => {
      return new Promise<void>((resolve, reject) => {
        ffmpeg(tempFilePath).outputOptions([
          '-vn',
          '-i', tempFilePath,
          '-ss', String(chapter.start_time),
          '-t', String(chapter.end_time - chapter.start_time)
        ]).on('error', err => {
          reject(err)
        }).pipe(fs.createWriteStream(path.join(folderPath, `${artistName} - ${index + 1} - ${chapter.title}.mp3`)))
          .on('end', () => {
            resolve()
          })
      })
    }))
  }
}
