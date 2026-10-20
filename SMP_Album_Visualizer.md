# SMP Album Visualizer — Technical Reference

**Current stable baseline:** v157.0  
**Authoritative implementation:** `SMP_Album_Visualizer.js`  
**Target:** foobar2000 1.6.x (32-bit) / Spider Monkey Panel 1.6.1

This document describes the current user-facing properties and behavior. The JavaScript source remains authoritative if a discrepancy is found. The project owner reports runtime testing complete for v156.0.

## 1. Overview

The panel presents the playing album as a combined artwork, album/artist header, track list, track-state indicators, optional subtitle, track-count badge, simulated eight-band frequency display, blurred artwork background, optional dark-overlay animation, and Floating Lights particle effect.

## 2. Interaction

- Left-click artwork: center the playing track in this panel's track list.
- Hover a track: update the hover state and cursor.
- Double-click a track: play it.
- Right-click inside the track list: retain the normal foobar2000 track context menu.
- Right-click elsewhere: open the custom Help / Resources and panel-command menu.
- Mouse wheel: scroll the track list by `NAVIGATION | Mouse wheel rows`.
- Ctrl + mouse wheel over Artist/Album: change their shared scale.
- Ctrl + mouse wheel over Track/Subtitle: change their shared scale.

The font-scale Properties are persisted with a debounce to avoid writing the Property on every wheel event. Effective font sizes are subject to their implementation ceilings.

## 3. Properties and defaults

Properties are grouped by name prefixes in the SMP Properties dialog. The values below are the current documented defaults.

### ANIMATION

| Property | Default |
|---|---:|
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
| `Track title format` | built-in title/artist/loved-track expression |
| `Subtitle title format` | `'%subtitle%'` |

The format properties accept foobar2000 title-format syntax. The default subtitle can be changed to expressions such as `%genre%`, `%date%`, `%style%`, or `$if(%genre%,%genre%,%style%)`.

### LAYOUT

| Property | Default |
|---|---:|
| `Header height ratio` | `0.105` |
| `Header left margin` | `0.115` |
| `Outer margin` | `0.040` |
| `Track gap ratio` | `0.014` |
| `Track list left margin` | `0.050` |
| `Track number width ratio` | `0.040` |

### NAVIGATION

| Property | Default |
|---|---:|
| `Center current track automatically` | `true` |
| `Mouse wheel rows` | `3` |

### TEXT

| Property | Default |
|---|---:|
| `Artist / Album title gap` | `24` |
| `Artist font scale` | `1.14` |
| `Track font scale` | `0.90` |

Artist and Album share one scale; Track and Subtitle share another. Ctrl + mouse wheel adjusts the applicable pair in increments of `0.1`. Maximum rendered font sizes can limit the effective scale.

### TRACK

| Property | Default |
|---|---:|
| `Show subtitle/tag line` | `true` |
| `Show track count badge` | `true` |

## 4. Album matching

Album tracks are discovered using Album Artist + Album first, Artist + Album when needed, and Album-only as a final fallback. The playing handle is retained in the displayed album list even if a metadata query returns an incomplete result.

## 5. Artwork and background

The artwork is displayed in the configured artwork area with a configurable border and corner radius. The background is derived from album artwork and can be blurred, tinted, and darkened. `BACKGROUND | Animate dark overlay` slowly varies the alpha used for drawing while playback is active; it does not change the stored overlay Property or rebuild the blurred bitmap on each animation step.

## 6. Floating Lights

Floating Lights are rendered over the blurred wallpaper layer, behind artwork and text. Current defaults are enabled, 60 particles, brightness `3`, and size `0.4`. They run during active playback and are stopped when playback is inactive or while Properties/Configure dialogs are open.

Particle accents are derived from the current artwork. When the maximum RGB channel of a selected accent is below `178`, all RGB channels are scaled proportionally until the maximum reaches `178`. Colors already at or above `178` are not modified. This adjustment occurs when selecting the artwork accent, not in the animation timer.

Particles use warm-neutral sparks and independent horizontal wandering. Direction changes are gradual and randomized, with occasional stronger sideways movements rather than abrupt constant-direction changes.

## 7. Frequency / RTA-style animation

The eight bands are a simulated RTA-style effect, not true FFT or PCM analysis. The bands range visually from slow bass motion to faster upper-frequency motion. The timer default is `40` ms. Animation is gated by playback state, and repainting alone does not advance the simulation.

## 8. Resource and dialog handling

The implementation caches reusable artwork, rounded artwork, no-cover artwork, blurred backgrounds, and font resources where appropriate. Animation timers are suspended around Properties/Configure dialogs and resumed when appropriate. The background redraw path avoids unnecessarily invalidating the blurred-background cache on resize.

## 9. Help / Resources menu

Right-click outside the track list opens Help / Documentation and links to Spider Monkey Panel documentation, the title-formatting reference, query syntax, foobar2000, its components page, the wiki, and forums. Panel commands include Reload, Open component folder, Panel properties, and Configure.

## 10. Current limitations

- The frequency bars are simulated, not a true audio FFT analyzer.
- The background overlay animation changes overlay alpha; it is not audio-reactive.
- The intended compatibility target is foobar2000 1.6.x 32-bit with Spider Monkey Panel 1.6.1.

## 11. Versioning and maintenance

The source version is declared by `window.DefineScript()` and must match the project release version. For v156.0:

```javascript
window.DefineScript('SMP Album Visualizer', {
    author: 'SMP Album Visualizer Project',
    version: '156.0',
```

The script's top comment also identifies release `156.0`. Keep `README.md`, `CHANGELOG.md`, this reference, and release/archive naming synchronized. The JavaScript source is authoritative.

## 12. Revision notes

### v156.0

- Declares release version `156.0` in the source header and `window.DefineScript()`.
- Consolidates Floating Lights defaults and behavior: enabled, 60 particles, brightness `3`, size `0.4`.
- Uses artwork-derived colors with the RGB brightness floor of `178`.
- Uses independent horizontal wandering with gradual randomized direction changes and occasional stronger sideways movement.
- Retains 40 ms frequency-bar timer default and optional animated dark overlay.
- Runtime testing complete per the project owner.

### v155.0

- Floating Lights feature and its configurable Properties were added/refined.
- Artwork-derived colors and particle-motion refinements were developed.
- Properties/Configure animation handling and background redraw behavior were refined.

### v154.0–v151.0

- Iteratively adjusted the optional dark-overlay animation cycle/range.
- Added the optional `BACKGROUND | Animate dark overlay` Property in v151.0.

### v150.0

- Improved album matching fallback and ensured the playing handle remains in the album list.

### v148.0 and earlier documented revisions

- Continued resource caching and font/GDI lifetime improvements. See `CHANGELOG.md` and the repository history for further details.

---

**End of v156.0 technical reference.**


## v157.0 — New properties

- `COLORS | Track number text`: controls the color used for track numbers. If no value is stored, it defaults to the value of `COLORS | Track text`.
- `TEXT | Album font scale`: independently controls Album title font size. If no value is stored, it initializes from `TEXT | Artist font scale`; after initialization, the values are independent.
