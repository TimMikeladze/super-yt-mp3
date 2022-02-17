# super-youtube-mp3

CLI tools for converting YouTube videos to MP3 files. Extract timestamps from video chapters, description, comments and automatically splits output into appropriately named files.

## Installation

> yarn add super-youtube-mp3

## Usage

```
Options:
  -ar, --artist <artist>   Name of the artist(s). If not specified, the artist will be extracted from the title.
  -al --album <album>      Name of the album. If not specified, the album will be extracted from the title.
  -f, --format <format>    Naming format of tracks. For example `%artist% - %album% - %track% - %title%` or `%track - %title%`
  -o, --output <path>      Output directory path. Required.
  -q, --quality <quality>  URL of YouTube video. Required.
  -u, --url <url>          URL of YouTube video. Defaults to highest quality.
  -h, --help               display help for command
```
