#!/usr/bin/env node

import { Command } from 'commander'
import { SuperSplitter } from './SuperSplitter'

interface CommanderOptions {
  url: string
  quality?: string
  output: string
  artist?: string
  album?: string
  format?: string
  id3?: boolean
  chapters?: boolean
  mp3?: boolean
  art?: boolean
  keepVideo?: boolean
}

const program = new Command()

program.option('-ar, --artist <artist>', 'Name of the artist(s). If not specified, the artist will be extracted from the title.')
program.option('-al --album <album>', 'Name of the album. If not specified, the album will be extracted from the title.')
program.option('-bs --batch-size <batchSize>', 'Number of files to process concurrently. Default: 2', parseInt)
program.option('-f, --format <format>', 'Naming format of tracks. For example `%artist% - %album% - %track% - %title%` or `%track - %title%`.')
program.option('-na, --no-art', 'Skip downloading album art.')
program.option('-nc, --no-chapters', 'Skip splitting output into chapters.')
program.option('-ni, --no-id3', 'Skip adding ID3 tags to the output files. Only works with MP3 files.')
program.option('-nm, --no-mp3', 'Skip converting output to mp3. Useful for downloading video. Album art will not be downloaded.')
program.option('-kv --keep-video', 'Keep the original video file.')
program.option('-o, --output <path>', 'Output directory path. Required.')
program.option('-q, --quality <quality>', 'Quality of YouTube video. Defaults to highest quality.')
program.option('-u, --url <url>', 'URL of YouTube video. Required.')

program.parse()

program.parse(process.argv)

const options: CommanderOptions = program.opts()

if (!options.url) {
  console.error('url is required')
  process.exit(1)
}

if (!options.output) {
  console.error('output directory path is required')
  process.exit(1)
}

const superSplitter = new SuperSplitter({
  url: options.url,
  output: options.output,
  quality: options.quality,
  id3: options.id3,
  chapters: options.chapters,
  mp3: options.mp3,
  format: options.format,
  keepVideo: options.keepVideo,
  art: options.art
})

let artist = options.artist
let album = options.album

superSplitter.init().then(async () => {
  if (!artist) {
    artist = await superSplitter.getArtistTitle()
  }

  if (!album) {
    album = await superSplitter.getAlbumTitle()
  }

  await superSplitter.download(artist, album)

  process.exit(0)
})
