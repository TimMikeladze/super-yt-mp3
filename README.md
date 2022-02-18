# super-yt-mp3

CLI tools for converting YouTube videos to MP3 files. Extract timestamps from video chapters, description, comments then splits output into appropriately named files. Automatically adds ID3 tags to the files.

## Installation

```shell
npx super-yt-mp3@latest
```

> Note: ffmpeg is required.

## Usage

```shell
Options:
  -ar, --artist <artist>   Name of the artist(s). If not specified, the artist will be extracted from the title.
  -al --album <album>      Name of the album. If not specified, the album will be extracted from the title.
  -f, --format <format>    Naming format of tracks. For example `%artist% - %album% - %track% - %title%` or `%track - %title%`.
  -na, --no-art            Skip downloading album art.
  -nc, --no-chapters       Skip splitting output into chapters.
  -ni, --no-id3            Skip adding ID3 tags to the output files. Only works with MP3 files.
  -nm, --no-mp3            Skip converting output to mp3. Useful for downloading video. Album art will not be downloaded.
  -kv --keep-video         Keep the original video file.
  -o, --output <path>      Output directory path. Required.
  -q, --quality <quality>  Quality of YouTube video. Defaults to highest quality.
  -u, --url <url>          URL of YouTube video. Required.
  -h, --help               display help for command
```

### Examples

Download a video and splits it into individual mp3 files based on the video's chapters. 

```shell
npx super-yt-mp3 -o ~/Downloads -u "url"
```

Download a video and converts into a single mp3 file.

```shell
npx super-yt-mp3 -o ~/Downloads -u "url" -nc
```

Download a video as a single mp4 file.

```shell
npx super-yt-mp3 -o ~/Downloads -u "url" -nm -nc -kv 
```

## How to run tests

Provide a URL to a video and run the following command.

```shell
URL="video url" yarn jest
```

> Note: The jest timeout is set to 60 seconds. A larger file or slow internet connection may cause the test to fail.

## TODO

- Provide timestamps via command line arguments
- Loading indicators
- Prompts for confirming metadata before downloading file
