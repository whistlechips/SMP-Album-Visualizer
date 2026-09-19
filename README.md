# SMP Album Visualizer for foobar2000

A customizable album-focused visualizer for [foobar2000](https://www.foobar2000.org/) using [Spider Monkey Panel](https://theqwertiest.github.io/foo_spider_monkey_panel/).

SMP Album Visualizer presents the currently playing album with album artwork, artist and album information, a track list, current-track and hover indicators, an optional subtitle line, and an animated eight-band RTA-style display.

<!-- SCREENSHOT-01: Main Album Visualizer -->
<img width="1022" height="561" alt="SMP Album Visualizer panel showing album artwork, track list, and frequency bars" src="https://github.com/user-attachments/assets/9023cc33-9d2a-484d-826a-8e2dc3207704" />

## Highlights

- **Album artwork** with configurable size, position, border, and rounded corners.
- **Artwork-derived background** using a blurred version of the current artwork with configurable tint and dark overlay.
- **Artist and album header** with configurable typography.
- **Track list** showing the album's tracks with current-track and hover highlighting.
- **Optional subtitle/tag line** driven by a configurable foobar2000 title-format expression.
- **Eight-band animated frequency display** with bass-to-treble motion characteristics.
- **Automatic current-track centering** when the displayed album changes or the artwork is clicked.
- **Mouse-wheel navigation** through the displayed track list.
- **Ctrl + mouse-wheel font scaling** for artist/album and track/subtitle text.
- **Context-sensitive right-click menu** with Help, documentation, resources, reload, Properties, and Configure commands.
- **Built-in Help** describing the panel's current controls and behavior.
- **Resource caching** for artwork, rounded artwork, no-cover images, backgrounds, and fonts to reduce unnecessary GDI allocation.

## Requirements

- foobar2000 **1.6.x, 32-bit**
- Spider Monkey Panel **1.6.1**
- A foobar2000 installation with Spider Monkey Panel available as a panel component.

The script is intended for the Windows/32-bit SMP environment above. Other versions may work, but are not the project's tested target.

## Installation

1. Download the current release from the project's **Releases** page.
2. Copy `SMP_Album_Visualizer.js` to a convenient location used for your SMP scripts.
3. Add a **Spider Monkey Panel** to your foobar2000 layout.
4. Configure the panel to use `SMP_Album_Visualizer.js`.
5. Start playback and the panel will build its display from the currently playing track.

The JavaScript file is the authoritative implementation. `SMP_Album_Visualizer.md` is the detailed project reference.

## User Interaction

### Album artwork

**Left-click the album artwork** to center the currently playing track in the displayed track list.

### Track list

- Move the mouse over a track to activate its hover state.
- Double-click a displayed track to play it.
- Right-click within the track list to open the normal foobar2000 track context menu.

### Mouse wheel

Use the mouse wheel over the track list to scroll according to the configured `NAVIGATION | Mouse wheel rows` setting.

### Font scaling

Hold **Ctrl** while using the mouse wheel over the appropriate text area:

- Artist/album area adjusts the shared artist/album scale.
- Track/subtitle area adjusts the shared track/subtitle scale.

Font scaling is persisted after a short debounce so repeated wheel movement does not continually write the Property.

<!-- SCREENSHOT-02: Interaction / Context Menu -->
<img width="525" height="275" alt="image" src="https://github.com/user-attachments/assets/5f499ae3-01f7-44fd-b19d-031df291ba56" />


## Album and Track Selection

The visualizer attempts to construct the displayed album using the most useful available metadata:

1. **Album Artist + Album**
2. **Artist + Album** when Album Artist is unavailable
3. **Album only** as a final fallback

After an album query succeeds, the implementation also verifies that the actual playing handle is represented in the resulting album track list and adds/sorts it when necessary.

This defensive behavior is important for libraries containing inconsistent or incomplete Album Artist metadata.

## Configuration

The panel's Properties are organized with category prefixes rather than separate nested folders. This keeps the SMP Properties dialog familiar while making related settings easier to locate.

Current categories include:

- `ANIMATION |`
- `ARTWORK |`
- `BACKGROUND |`
- `COLORS |`
- `FONTS |`
- `FORMATS |`
- `LAYOUT |`
- `NAVIGATION |`
- `TEXT |`
- `TRACK |`

The complete Property list, defaults, and implementation details are maintained in `SMP_Album_Visualizer.md`.

### Frequently useful settings

**Artwork**

- Artwork area width and top position
- Artwork border
- Artwork corner-radius ratio
- No-cover image and text

**Background**

- Artwork-derived blur
- Purple tint
- Dark overlay
- Optional slow dark-overlay animation

**Text**

- Artist/album font scale
- Track/subtitle font scale
- Artist and track font settings

**Track display**

- Track title format
- Subtitle title format
- Show/hide subtitle
- Current-track and hover background colors

**Navigation**

- Mouse-wheel row count
- Current-track centering behavior

<!-- SCREENSHOT-03: SMP Properties -->
<img width="682" height="531" alt="image" src="https://github.com/user-attachments/assets/577bafb9-5ac4-4887-bc06-3492fad3268a" />


## Frequency / RTA-Style Display

The visualizer contains **eight simulated frequency bands**:

| Band | Range | General behavior |
|---:|---|---|
| 1 | 20–60 Hz | Slow, heavy bass motion |
| 2 | 60–120 Hz | Slower bass |
| 3 | 120–250 Hz | Low-mid |
| 4 | 250–500 Hz | Midrange |
| 5 | 500 Hz–1 kHz | More active midrange |
| 6 | 1–2 kHz | Quicker upper-mid motion |
| 7 | 2–5 kHz | Faster presence |
| 8 | 5–20 kHz | Fastest motion |

The display is deliberately a **simulated RTA-style visualization**, not a true FFT/audio-spectrum analyzer. Its band behavior is designed to give the panel a convincing music-responsive appearance while remaining within the capabilities of the SMP JavaScript environment.

The animation:

- runs while playback is active;
- stops when playback is paused or stopped;
- does not advance simply because the panel is repainting;
- uses separate state-update and drawing logic.

A future real-time audio analyzer would require a native foobar2000 visualization/audio-analysis bridge or equivalent functionality beyond the standard SMP JavaScript API.

## Background Animation

v155.0 includes an optional slowly changing dark-overlay effect.

`BACKGROUND | Animate dark overlay` can be enabled to produce a subtle breathing/hypnotic change in the background darkness.

The v155.0 baseline uses:

- approximately **±40 alpha** variation;
- a **30-second animation cycle**;
- a **200 ms update interval**.

The animation changes only the overlay alpha used for drawing. It does **not** rebuild the cached blurred background bitmap on every animation step.

## Artwork and Resource Handling

Performance and resource lifetime became an important part of the project's development.

The visualizer caches reusable resources including:

- fonts;
- rounded artwork;
- no-cover artwork;
- blurred background images.

This avoids repeatedly creating GDI resources during frequent animation repaints. The current implementation also invalidates the appropriate caches when artwork, size, or other relevant conditions change.

## Help and Documentation

Right-click outside the track list opens the custom **Help / Resources** menu.

It provides access to:

- Help / Documentation
- Spider Monkey Panel Documentation
- Title Formatting Reference
- Query Syntax
- foobar2000 Homepage
- Components
- Wiki
- Forums
- Reload
- Open component folder
- Panel properties...
- Configure...

The script also contains built-in Help covering the panel's current behavior and configuration.

## Current Limitations

### No true FFT analysis

The frequency display is simulated rather than derived from PCM audio data. This is an intentional boundary of the current SMP implementation.

### SMP / foobar2000 target

The project is developed and tested against the stated foobar2000 1.6.x 32-bit and Spider Monkey Panel 1.6.1 environment. Compatibility with other versions is not guaranteed.

## Documentation

The repository contains two complementary levels of documentation:

- **`README.md`** — project overview, installation, major features, and user-oriented information.
- **`SMP_Album_Visualizer.md`** — detailed technical/project reference, including current configuration, interaction behavior, implementation boundaries, and revision history.

The JavaScript source remains authoritative for implementation details.

## Version

### v155.0

v155.0 is the current stable project baseline.

Notable current-state work includes:

- stable cached artwork/background resource handling;
- defensive Album Artist / Artist / Album fallback;
- optional animated dark background overlay;
- 30-second overlay animation cycle;
- configurable subtitle title formatting;
- Ctrl + mouse-wheel font scaling;
- current-track centering;
- context-sensitive Help / Resources menu;
- eight-band simulated RTA-style animation.

[View the v155.0 release](https://github.com/whistlechips/SMP-Album-Visualizer/releases/tag/v155.0)

## Project Development and Provenance

SMP Album Visualizer is maintained as an independent community script for Spider Monkey Panel.

The project was developed with assistance from OpenAI's ChatGPT during design, debugging, refactoring, documentation, testing analysis, and revision work.

See:

- `AUTHORS.md`
- `THIRD_PARTY_NOTICES.md`

for additional authorship/provenance and third-party-notice information.

## License

This project is licensed under the **MIT License**. See [`LICENSE`](LICENSE) for the complete license text.

---

**SMP Album Visualizer for foobar2000 — v155.0**
