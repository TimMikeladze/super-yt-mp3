# super-yt-mp3

CLI tools for converting YouTube videos to MP3 files. Extract timestamps from video chapters, description, comments then splits output into appropriately named files. Automatically adds ID3 tags to the files.

## Installation

```shell
npx super-yt-mp3
```

> Note: ffmpeg is required.

## Usage

```shell
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

## Examples

```shell
npx super-yt-mp3 -o ~/Downloads -u "url of video"
```

## How to run tests

Provide a URL to a video and run the following command.

```shell
URL="video url" yarn jest
```

> Note: The jest timeout is set to 30 seconds. A larger file or slow internet connection may cause the test to fail.

## TODO

- Concurrency option and default
- Provide timestamps via command line arguments
- Extract timestamps as text from video description or comments
- Loading indicators
- Prompts for confirming metadata before downloading file
