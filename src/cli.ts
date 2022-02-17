#!/usr/bin/env node

import { Command } from 'commander'
import { SuperSplitter } from './SuperSplitter'

interface CommanderOptions {
  url: string
  quality?: string
  output: string
}

const program = new Command()

program.option('-o, --output <path>', 'output directory path')
program.option('-q, --quality <quality>', 'URL of YT video')
program.option('-u, --url <url>', 'URL of YT video')

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
})

superSplitter.download(options.url, options.output).then(() => {
  process.exit(0)
})
