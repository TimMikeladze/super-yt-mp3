import { SuperSplitter } from '../src'
import path from 'path'
import fs from 'fs'
import NodeID3 from 'node-id3'

jest.setTimeout(30000)

describe('SuperSplitter', () => {
  it('happy path - downloads, splits and tags', async () => {
    const splitter = new SuperSplitter({
      url: process.env.URL,
      output: './__tests__/output/'
    })
    await splitter.init()
    const artist = await splitter.getArtistTitle()
    const album = await splitter.getAlbumTitle()
    await splitter.download(artist, album)
    const folderPath = path.resolve(path.join(splitter.options.output, `${artist} - ${album}`))

    expect(fs.existsSync(folderPath)).toBe(true)
    const files = fs.readdirSync(folderPath)
    expect(files.length).toBeGreaterThan(0)
    const tags = NodeID3.read(path.join(folderPath, files[0]))
    expect(tags).toMatchObject({
      artist: artist,
      album: album,
      trackNumber: '1',
      title: expect.any(String),
      userDefinedUrl: [
        {
          description: 'Youtube URL',
          url: process.env.URL
        }
      ]
    })
  })
})
