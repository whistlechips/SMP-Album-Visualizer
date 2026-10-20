# SMP Album Visualizer for foobar2000

A customizable album-focused visualizer for [foobar2000](https://www.foobar2000.org/) using [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel/).

<!-- SCREENSHOT-01: Main Album Visualizer -->
<img width="1360" height="642" alt="image" src="https://github.com/user-attachments/assets/2a282862-ebf5-4acf-8e04-642f9a2967dc" />

     
**Current stable baseline: v157.0.** The project owner has completed runtime testing of this baseline. The script's SMP version declaration, documentation, and release files use `156.0` consistently. The older `Version 2.0` source-header label has been replaced with the actual project release version to avoid ambiguity.

SMP Album Visualizer presents the currently playing album with album artwork, artist and album information, a track list, current-track and hover indicators, an optional subtitle line, an animated eight-band RTA-style display, and optional floating-light/background effects.

## v157.0 changes

- Added `COLORS | Track number text`, defaulting to the current `COLORS | Track text` value when unset.
- Added independent `TEXT | Album font scale`, initialized from `TEXT | Artist font scale` when no Album scale has been saved.


## Highlights

- **Album artwork** with configurable area, position, border, and rounded corners.
- **Artwork-derived blurred background** with configurable tint and dark overlay.
- **Optional animated dark overlay** with a slow breathing effect while playback is active.
- **Floating Lights** layered over the blurred wallpaper behind artwork and text. The lights use artwork-derived colors, warm-neutral sparks, independent horizontal drift, gradual direction changes, and occasional stronger sideways movement.
- **Artwork-color brightness floor:** sampled colors whose maximum RGB channel is below 178 are proportionally scaled to that floor while preserving hue; colors already at or above 178 remain unchanged. This adjustment is made when the artwork accent is selected, not on every animation tick.
- **Artist and album header** with configurable typography and paired sizing.
- **Track list** with current-track and hover highlighting, optional subtitle/tag line, and track-count badge.
- **Eight-band simulated RTA-style display** with bass-to-treble motion characteristics and configurable update interval.
- **Automatic current-track centering** and mouse-wheel track-list navigation.
- **Ctrl + mouse-wheel font scaling** for artist/album and track/subtitle text.
- **Context-sensitive Help / Resources menu** and built-in Help.
- **Resource caching** for artwork, backgrounds, and fonts to reduce unnecessary GDI allocation.

## Requirements

- foobar2000 **1.6.x, 32-bit**
- Spider Monkey Panel **1.6.1**
- Windows environment supported by the target foobar2000/SMP setup

The project targets the versions above. Compatibility with other versions is not guaranteed.

## Installation

1. Download or copy `SMP_Album_Visualizer.js` from this repository.
2. Place it in a convenient location used for SMP scripts.
3. Add a **Spider Monkey Panel** to the foobar2000 layout.
4. Configure the panel to use `SMP_Album_Visualizer.js`.
5. Start playback. The panel builds its display from the playing track and available album metadata.

`SMP_Album_Visualizer.js` is the authoritative implementation. `SMP_Album_Visualizer.md` documents properties and implementation behavior.

## User interaction

- **Left-click artwork:** center the playing track in the visualizer's track list.
- **Track hover:** highlight the row and update the cursor.
- **Double-click a track:** play that track.
- **Right-click in the track list:** open the normal foobar2000 track context menu.
- **Right-click elsewhere:** open Help / Resources, reload, component-folder, Properties, and Configure commands.
- **Mouse wheel:** scroll the displayed track list.
- **Ctrl + mouse wheel:** adjust the shared Artist/Album or Track/Subtitle font scale according to the hovered text area.
<img width="218" height="237" alt="image" src="https://github.com/user-attachments/assets/f9fa8373-f3a7-45f2-8ae2-7a88c4b79014" />

## Album and track selection

The visualizer attempts to build the album list using the following order:

1. Album Artist + Album.
2. Artist + Album when Album Artist is unavailable or the preferred lookup does not provide a usable result.
3. Album-only as a final fallback.

The implementation also checks that the currently playing handle remains represented in the album track list when metadata queries return an incomplete or inconsistent set.

## Configuration
<img width="682" height="531" alt="image" src="https://github.com/user-attachments/assets/e5e8ebd4-7863-4514-9b75-d73c36742357" />

### ANIMATION

| Property | Default |
|---|---|
| `EQ / frequency bars timer interval (ms)` | `40` |
| `EQ / frequency bars enable` | `true` |
| `Floating lights enable` | `true` |
| `Floating lights number (4-100)` | `60` |
| `Floating lights brightness (0.25-5.0)` | `3` |
| `Floating lights size (0.25-2.5)` | `0.4` |

### ARTWORK

| Property | Default |
|---|---|
| `Artwork area width ratio` | `0.46` |
| `Artwork border` | `'255,255,255,25'` |
| `Artwork corner radius ratio` | `0.04` |
| `Artwork top ratio` | `0.12` |
| `No cover image path` | `''` |
| `No cover text` | `'NO COVER'` |

### BACKGROUND

| Property | Default |
|---|---|
| `Background - purple tint` | `'36,31,54,42'` |
| `Background blur radius` | `48` |
| `Background dark overlay` | `'0,0,0,125'` |
| `Animate dark overlay` | `true` |

### COLORS

| Property | Default |
|---|---|
| `Album text` | `'211,209,216,255'` |
| `Artist text` | `'248,248,249,255'` |
| `Font text` | `'215,214,220,255'` |
| `Muted text` | `'130,128,137,255'` |
| `Subtitle text` | `'185,182,191,255'` |
| `Track text` | `'215,214,220,255'` |
| `Track number text` | Same as `Track text` |
| `Current track background color` | `'255,255,255,70'` |
| `Hover background color` | `'255,255,255,70'` |

### FONTS

| Property | Default |
|---|---|
| `Artist font` | `'Roboto Condensed Bold'` |
| `Artist font style` | `1` |
| `Track Font` | `'Roboto Condensed Light'` |

### FORMATS

| Property | Default |
|---|---|
| `Album title format` | `'%album%'` |
| `Track title format` | Built-in title/artist/loved-track expression |
| `Subtitle title format` | `'%subtitle%'` |

### LAYOUT

| Property | Default |
|---|---|
| `Header height ratio` | `0.105` |
| `Header left margin` | `0.115` |
| `Outer margin` | `0.040` |
| `Track gap ratio` | `0.014` |
| `Track list left margin` | `0.050` |
| `Track number width ratio` | `0.040` |

### NAVIGATION

| Property | Default |
|---|---|
| `Center current track automatically` | `true` |
| `Mouse wheel rows` | `3` |

### TEXT

| Property | Default |
|---|---|
| `Artist / Album title gap` | `24` |
| `Artist font scale` | `1.14` |
| `Album font scale` | Same as `Artist font scale` (`1.14`) |
| `Track font scale` | `0.90` |

### TRACK

| Property | Default |
|---|---|
| `Show subtitle/tag line` | `true` |
| `Show track count badge` | `true` |

Floating lights run during active playback and are stopped around Properties/Configure dialogs and when playback is inactive. The complete property list and defaults are in `SMP_Album_Visualizer.md`.

## Frequency / RTA-style display

The eight displayed bands are simulated and are **not a true FFT/audio-spectrum analyzer**. Their apparent behavior ranges from slow bass motion to faster upper-frequency motion. Animation state is advanced by the timer rather than by repainting, and the timer is gated by playback state.

## Background and Floating Lights

The background uses a blurred version of the current artwork, with configurable tint and dark overlay. The optional overlay animation changes the alpha used for drawing and reuses the cached blurred bitmap.

Floating Lights are drawn over the blurred wallpaper layer and behind the artwork and text. Their count, brightness, and size are configurable. Artwork-derived accent color is brightened proportionally only when its strongest RGB channel is below 178, which helps keep particles visible on dark covers without altering already-bright samples.

## Documentation

- **`README.md`** — overview, installation, interaction, and major features.
- **`SMP_Album_Visualizer.md`** — configuration reference, defaults, technical behavior, limitations, and revision notes.
- **`CHANGELOG.md`** — release-by-release changes.
- **`AUTHORS.md`** — project authorship and development provenance.
- **`THIRD_PARTY_NOTICES.md`** — runtime and third-party notices.
- **`LICENSE`** — MIT License.

## Version 156.0

The v156.0 baseline consolidates the current Floating Lights behavior and the related Properties cleanup, artwork-derived color handling, and animation stability work. The project owner reports runtime testing complete for this baseline.

## License

This project is distributed under the **MIT License**. See [`LICENSE`](LICENSE).

---

**SMP Album Visualizer for foobar2000 — v156.0**
