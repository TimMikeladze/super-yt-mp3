# super-youtube-mp3

CLI tools for converting YouTube videos to MP3 files. Extract timestamps from video chapters, description, comments and automatically splits output into appropriately named files. Automatically adds ID3 tags to the files.

## Installation

> yarn add super-youtube-mp3

> Note: ffmpeg is required.

## Usage

```
Options:
  -ar, --artist <artist>   Name of the artist(s). If not specified, the artist will be extracted from the title.
  -al --album <album>      Name of the album. If not specified, the album will be extracted from the title.
  -f, --format <format>    Naming format of tracks. For example `%artist% - %album% - %track% - %title%` or `%track - %title%`
  -id3, --id3 <id3>        Add ID3 tags to the output files. Defaults to `true`
  -o, --output <path>      Output directory path. Required.
  -q, --quality <quality>  Quality of YouTube video. Defaults to highest quality.
  -u, --url <url>          URL of YouTube video. Required.
  -h, --help               display help for command
```

## How to run tests


Provide a URL to a video and run the following command.

```shell
URL="video url" yarn jest
```

> Note: The jest timeout is set to 30 seconds. A larger file or slow internet connection may cause the test to fail.
