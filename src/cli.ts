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
}

const program = new Command()

program.option('-ar, --artist <artist>', 'Name of the artist(s). If not specified, the artist will be extracted from the title.')
program.option('-al --album <album>', 'Name of the album. If not specified, the album will be extracted from the title.')
program.option('-f, --format <format>', 'Naming format of tracks. For example `%artist% - %album% - %track% - %title%` or `%track - %title%`')
program.option('-o, --output <path>', 'Output directory path. Required.')
program.option('-q, --quality <quality>', 'URL of YouTube video. Required.')
program.option('-u, --url <url>', 'URL of YouTube video. Defaults to highest quality.')

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
  url: options.url
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

  await superSplitter.download(artist, album, options.output, options.quality, options.format)

  process.exit(0)
})
