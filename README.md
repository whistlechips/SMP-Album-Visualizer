# SMP Album Visualizer for foobar2000

A Spider Monkey Panel (SMP) script for foobar2000 that presents the currently
playing album as an album-artwork and track-list visualizer.

## Current release

**Version:** 155.0  
**Target:** Spider Monkey Panel 1.6.1 / foobar2000 1.6.x 32-bit

The authoritative implementation is `SMP_Album_Visualizer.js`.
See `SMP_Album_Visualizer.md` for the maintained project reference.

## Features

- Album artwork with configurable rounded corners
- Artwork-derived blurred background with tint and dark overlay
- Artist and album header
- Track list with current/hover indicators
- Optional subtitle/tag line using a configurable title-format expression
- Eight-band simulated RTA-style frequency animation
- Automatic current-track centering
- Mouse-wheel navigation
- Ctrl + mouse-wheel font scaling
- Context-sensitive Help / Resources menu
- Built-in Help / Documentation
- Album Artist / Artist / Album fallback handling
- Cached artwork/background resources to reduce repeated GDI allocation

## Frequency display

The eight-band display is a simulated RTA-style animation, not a true FFT
audio analyzer. Real-time audio analysis would require functionality outside
the standard SMP JavaScript API, such as a native foobar2000 visualization
bridge/component.

## Project provenance

The project is maintained as an independent community script for Spider Monkey
Panel and was developed with assistance from OpenAI's ChatGPT.

See `AUTHORS.md` and `THIRD_PARTY_NOTICES.md` for additional provenance and
licensing information.

## License

MIT License. See `LICENSE`.
