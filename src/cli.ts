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
  id3?: string
}

const program = new Command()

program.option('-ar, --artist <artist>', 'Name of the artist(s). If not specified, the artist will be extracted from the title.')
program.option('-al --album <album>', 'Name of the album. If not specified, the album will be extracted from the title.')
program.option('-f, --format <format>', 'Naming format of tracks. For example `%artist% - %album% - %track% - %title%` or `%track - %title%`')

program.option('-id3, --id3 <id3>', 'Add ID3 tags to the output files. Defaults to `true`')
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
  id3: options?.id3 !== 'false',
  format: options.format
})

let artist = options.artist
let album = options.album

superSplitter.init(options.url).then(async () => {
  if (!artist) {
    artist = await superSplitter.getArtistTitle()
  }

  if (!album) {
    album = await superSplitter.getAlbumTitle()
  }

  await superSplitter.download(artist, album)

  process.exit(0)
})
