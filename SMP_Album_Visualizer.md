# SMP Album Visualizer — Technical Reference

**Current script version:** v159.6  
**Versioned source:** `SMP_Album_Visualizer_v159.6.js`  
**Target:** foobar2000 1.6.x (32-bit) / Spider Monkey Panel 1.6.1  
**Documentation updated:** November 23, 2026

This reference describes the v159.6 implementation. The JavaScript source remains authoritative. The companion [README.md](README.md) provides installation and a shorter overview.

## Overview

SMP Album Visualizer displays the current album using album artwork, a blurred artwork-derived background, an artist/album header, an album track list, current-track and hover indicators, optional subtitles, a track-count badge, eight simulated frequency bands, and optional background animations.

Version 159.6 adds an independent title-format expression for track tooltips. Tooltips use the panel-drawn renderer introduced in v159.5, keeping their background and text in the same paint cycle as the animations. There is no seekbar or elapsed-time display.

## Requirements and installation

- foobar2000 1.6.x, 32-bit.
- Spider Monkey Panel 1.6.1.
- Windows supported by that foobar2000/SMP installation.

The script is self-contained. It does not require an external Markdown viewer for its built-in Help. Configured fonts are used when available; font creation includes fallback choices.

1. Back up the current script and any customized panel settings.
2. Extract the script release ZIP.
3. Open the panel's **Configure...** command by right-clicking outside the track list.
4. Replace the entire existing script with `SMP_Album_Visualizer_v159.6.js`, then apply/save. For a panel configured to load a file, select the extracted file through that existing configuration.
5. Start playback to populate the album display.

A repository may retain the canonical filename `SMP_Album_Visualizer.js`. If the versioned source is renamed for that purpose, its contents and declared version must still be v159.6. This documentation ZIP contains `README.md`, `SMP_Album_Visualizer.md` and `CHANGELOG.md` only; it does not replace the script release ZIP.

## Interaction

| Action | Result |
|---|---|
| Left-click artwork | Center the playing track in the panel's track list, subject to the current-track centering setting. |
| Hover a track row | Highlight the row and, after approximately 450 ms, show its configured tooltip if the result is nonempty. |
| Double-click a track | Play that track. |
| Right-click a track | Open the normal foobar2000 context menu for that track. |
| Right-click elsewhere | Open Help / Resources and panel commands. |
| Mouse wheel | Scroll by the configured mouse-wheel row count. |
| Ctrl + mouse wheel over Artist/Album | Adjust the paired header font scales by 0.1. |
| Ctrl + mouse wheel over Track/Subtitle | Adjust the track/subtitle font scale by 0.1. |

Font-size ceilings can limit the effective scale. Font-scale writes use a short debounce, avoiding a Property write on every wheel event.

## Properties and source defaults

Names below include their exact category prefixes. Defaults apply when the relevant Property is first created; existing saved values remain in use. Numeric and font-scale Properties can be stored as strings while the script uses numeric values internally.

### ANIMATION

| Property | Default |
|---|---|
| `ANIMATION \| EQ / frequency bars timer interval (ms)` | `40` |
| `ANIMATION \| EQ / frequency bars enable` | `true` |
| `ANIMATION \| Floating lights enable` | `true` |
| `ANIMATION \| Floating lights size (0.25-2.5)` | `0.4` |
| `ANIMATION \| Floating lights brightness (0.25-5.0)` | `3` |
| `ANIMATION \| Floating lights number (4-100)` | `60` |

### ARTWORK

| Property | Default |
|---|---|
| `ARTWORK \| Artwork area width ratio` | `0.46` |
| `ARTWORK \| Artwork border` | `255,255,255,25` |
| `ARTWORK \| Artwork corner radius ratio` | `0.04` |
| `ARTWORK \| Artwork top ratio` | `0.12` |
| `ARTWORK \| No cover image path` | Empty string |
| `ARTWORK \| No cover text` | `NO COVER` |

### BACKGROUND

| Property | Default |
|---|---|
| `BACKGROUND \| Background - purple tint` | `36,31,54,42` |
| `BACKGROUND \| Background blur radius` | `48` |
| `BACKGROUND \| Background dark overlay` | `0,0,0,125` |
| `BACKGROUND \| Animate dark overlay` | `true` |

### COLORS

| Property | Default |
|---|---|
| `COLORS \| Album text` | `211,209,216,255` |
| `COLORS \| Artist text` | `248,248,249,255` |
| `COLORS \| Font text` | `215,214,220,255` |
| `COLORS \| Muted text` | `130,128,137,255` |
| `COLORS \| Subtitle text` | `185,182,191,255` |
| `COLORS \| Track text` | `215,214,220,255` |
| `COLORS \| Track number text` | Inherits `COLORS \| Track text` when first created. |
| `COLORS \| Current track background color` | `255,255,255,70` |
| `COLORS \| Hover background color` | `255,255,255,70` |

### FONTS

| Property | Default |
|---|---|
| `FONTS \| Artist font` | `Roboto Condensed Bold` |
| `FONTS \| Artist font style` | `1` |
| `FONTS \| Track Font` | `Roboto Condensed Light` |

### FORMATS

| Property | Default |
|---|---|
| `FORMATS \| Album title format` | `%album%` |
| `FORMATS \| Track tooltip format` | Artist, Genre, Date and Composer expression; see below. |
| `FORMATS \| Track title format` | Built-in title / Various Artists / loved-track expression; see below. |
| `FORMATS \| Subtitle title format` | `%subtitle%` |

### LAYOUT

| Property | Default |
|---|---|
| `LAYOUT \| Header height ratio` | `0.105` |
| `LAYOUT \| Header left margin` | `0.115` |
| `LAYOUT \| Outer margin` | `0.04` |
| `LAYOUT \| Track gap ratio` | `0.014` |
| `LAYOUT \| Track list left margin` | `0.05` |
| `LAYOUT \| Track number width ratio` | `0.04` |

### NAVIGATION

| Property | Default |
|---|---|
| `NAVIGATION \| Center current track automatically` | `true` |
| `NAVIGATION \| Mouse wheel rows` | `3` |

### TEXT

| Property | Default |
|---|---|
| `TEXT \| Artist / Album title gap` | `24` |
| `TEXT \| Artist font scale` | `1.14` |
| `TEXT \| Album font scale` | Inherits `TEXT \| Artist font scale` when first created. |
| `TEXT \| Track font scale` | `0.90` |

### TRACK

| Property | Default |
|---|---|
| `TRACK \| Show subtitle/tag line` | `true` |
| `TRACK \| Show track count badge` | `true` |

The source default for `BACKGROUND | Animate dark overlay` is **true**. Existing installations keep their saved value. The default frequency update interval is **40 ms**; the implementation clamps its actual interval to at least **30 ms** and throttles the animation's repaint requests separately.

`TEXT | Album font scale` and `TEXT | Artist font scale` are separate saved Properties. Ctrl + wheel provides paired adjustment. Subtitle scale is derived internally at one-half of the track scale; there is no separate subtitle-scale Property in this version. The shared wheel-control range is nominally 0.5 through 2.0, with font-size ceilings affecting the effective maximum.

## Title formatting

The format Properties use foobar2000 title-format expressions. Album title, track title, subtitle and tooltip formats have distinct roles.

### Track title format

The default track-title expression shows the title and, for Various Artists albums, an artist suffix. It also appends a heart when supported `lfm_loved` or `smp_loved` fields indicate a loved track. The source default is:

```text
$if($stricmp(%album artist%,Various Artists),%title%$rgb(130,128,137) • %artist%$rgb()$ifequal([%lfm_loved%],1,  ♥,$ifequal([%smp_loved%],1,  ♥,)),%title%$ifequal([%lfm_loved%],1,  ♥,$ifequal([%smp_loved%],1,  ♥,)))
```

The track-title renderer interprets evaluated `$rgb()` color sequences. Text color Properties use the RGBA form described below.

### Subtitle title format

`FORMATS | Subtitle title format` defaults to `%subtitle%`. It can use another field or expression, such as `%genre%`, `%date%`, `%style%`, or `$if(%genre%,%genre%,%style%)`. `TRACK | Show subtitle/tag line` controls whether this secondary line appears in the track list.

### Track tooltip format

**`FORMATS | Track tooltip format` controls the entire tooltip independently of the track title, subtitle expression, and subtitle visibility.** It is evaluated against the hovered track, which may differ from the currently playing track.

Default expression, entered as one line:

```text
[Artist: %artist%]$char(10)[Genre: %genre%]$char(10)[Date: %date%]$char(10)[Composer: %composer%]
```

Example using an additional custom tag:

```text
[Genre: %genre%]$char(10)[Style: %style%]$char(10)[Composer: %composer%]
```

| Syntax or setting | Behavior |
|---|---|
| `$char(10)` | Insert a line break. |
| `[Genre: %genre%]` | Make the labeled field optional according to foobar2000's title-format rules. |
| `%style%` | Read the corresponding tag/field; use the names present in your own files. |
| Empty or whitespace-only tooltip Property | Disable tooltips; an explicitly blank value survives reloads. |
| Empty evaluated result | Show no tooltip. |
| Empty lines or standalone `?` / `[?]` lines | Remove them from the displayed result. |
| Evaluated color controls | Remove them; tooltip text uses its own fixed colors. |

Use optional sections around fields that may be absent. The script does not remove arbitrary question marks embedded in otherwise meaningful text. Standard foobar2000 field fallback behavior still applies.

#### Applying an edit

1. Right-click outside the track list and choose **Panel properties...**.
2. Edit **FORMATS | Track tooltip format**.
3. Close Properties with **OK**.
4. Move onto a track row and pause briefly.

The new expression is read and compiled after Properties closes; restarting foobar2000 is unnecessary. The Configure dialog's return path also synchronizes this Property. Other Properties retain their existing update behavior; this does not promise live synchronization for every setting.

#### Tooltip rendering and limits

- The tooltip is drawn inside the panel after its normal content, including during animation repaints.
- Its appearance is pale opaque background, dark text, a border, and Segoe UI at the script's 12-pixel font setting, with normal font fallback.
- It wraps at up to 600 pixels and stays within panel boundaries.
- Exceptionally long text is shortened with an ellipsis when the available panel height cannot contain it. Panels too small to fit a tooltip line and padding cannot display the box.
- Leaving the list, scrolling, resizing, album/layout changes, menus/dialogs, double-click playback, and unloading clear the tooltip. After such a change, move the pointer again to establish a new hover.
- Metadata notifications invalidate the cached hover text, including for non-playing tracks.

The expression is compiled at initialization and when its saved text changes. Results, including empty results, are cached for the hovered row rather than evaluated during every mouse movement or animation repaint. This is a metadata tooltip, not a continuously updating playback-time display.

Detected compilation or evaluation exceptions suppress the tooltip and produce one console message per format change. The saved expression is retained for correction. Expressions that foobar2000 accepts as literal text remain literal text; the script does not provide a separate title-format syntax validator.

## Album discovery and navigation

The Media Library is the preferred source for album membership; the active playlist is used when the library is unavailable or empty. Matching attempts Album Artist + Album, then Artist + Album, then an Album-only fallback. When necessary, the currently playing handle is retained in the album list and the result is sorted.

The current-track centering Property controls automatic centering behavior. Mouse-wheel scrolling uses `NAVIGATION | Mouse wheel rows` and remains separate from Ctrl + wheel font sizing.

## Artwork, background and color handling

Embedded artwork is preferred by the implemented lookup path. A configured no-cover image and generated no-cover artwork/text provide fallbacks. Artwork is retained while a replacement loads to reduce blank frames. The script caches rounded artwork, fallback images, blurred backgrounds and fonts where appropriate.

The background comes from album artwork, with blur, purple tint and dark-overlay settings. `BACKGROUND | Animate dark overlay` adds slow variation to the overlay alpha during active playback. The implementation uses a 30-second cycle, a 40-alpha modulation range and a 200 ms update interval. This changes only drawing state, leaving the saved overlay value unchanged and reusing the blurred-background cache.

Color Properties use comma-separated `R,G,B,A` byte values, each from 0 to 255. Alpha 0 is transparent and alpha 255 is opaque. The shared text renderer composites translucent text off-screen at the selected opacity, including formatted track-title runs; opaque text retains its direct drawing path. Tooltip colors are fixed by its renderer rather than drawn from track-text color Properties.

## Floating Lights

Floating Lights appear over the blurred wallpaper and behind artwork and text. Source defaults are enabled, 60 particles, brightness 3 and size 0.4. They animate during active playback and stop when playback is paused/stopped or Properties/Configure dialogs are open, resuming when appropriate.

Particle accents are derived from artwork. Selected accents whose strongest RGB channel is below 178 are proportionally brightened to that floor; brighter selections remain unchanged. The adjustment occurs when choosing the accent. Warm-neutral sparks, randomized horizontal drift and occasional stronger sideways changes provide variation.

## Frequency and current-track animation

The eight frequency bands are a **simulated RTA-style effect**, not FFT or PCM analysis. Motion is slower in the bass and faster toward the treble. Frequency state advances through the animation timer, not through painting. Playback state gates the effect; pause/stop freezes the bars. The timer and limited/throttled repaint requests are separate concerns.

The current-track indicator includes a bright leading edge that blinks during active playback and remains visible when inactive. Animation timers are stopped during relevant modal dialogs and script unload.

## Help / Resources

Right-clicking outside the track list opens the custom menu. It includes:

- **Help / Documentation**, displayed by the script through foobar2000.
- Spider Monkey Panel Documentation, Title Formatting Reference and Query Syntax.
- foobar2000 Homepage, Components, Wiki and Forums.
- Reload, Open component folder, Panel properties... and Configure....

The built-in Help includes a **Track Tooltip Format** section. The external Markdown documents describe the same v159.6 behavior.

## Validation and regression checks

JavaScript syntax checks and mock-host checks passed for the v159.6 changes. The mock checks cover default/blank Properties, compilation reuse, hovered-handle evaluation, cached empty results, no repeated evaluation during animation repaints, metadata invalidation, format synchronization, exception containment, and recovery. The existing overlay checks cover delayed hover, repeated paints, wrapping, Unicode, bounded layout, cancellation and mouse controls.

These checks do not execute Windows GDI, Spider Monkey Panel or foobar2000's actual title-format parser. Panel-drawn tooltip display was confirmed working in v159.5. Extended runtime testing of v159.6 is pending before GitHub publication.

Suggested runtime checks:

1. Hover a non-playing track and verify its own Artist, Genre, Date and Composer values.
2. Change the tooltip expression, close Properties and verify the next hover uses it.
3. Check custom/missing fields, line breaks, Unicode, long values and Various Artists albums.
4. Clear the expression, reload, and verify it stays disabled; restore an expression and verify recovery.
5. Test while playing, paused and stopped with the normal animations enabled.
6. Check tooltip cleanup after leaving, scrolling, resizing, metadata changes and dialogs.
7. Recheck Ctrl + wheel, artwork centering, double-click playback, menus and saved settings.

## Revision notes

| Version | Relevant change |
|---|---|
| v159.6 | Independent `FORMATS \| Track tooltip format`, hovered-track evaluation, caching, persistent blank disable, post-dialog synchronization and Help update. |
| v159.5 | Tooltip background and text rendered within the panel to address intermittent native-window drawing problems during playback. |
| v159.2–v159.4 | Initial native-tooltip implementation and subsequent display/activation corrections; superseded by the panel-drawn renderer. |
| v158.0 | Alpha-aware shared text rendering, including formatted title runs. |

## Maintenance and provenance

Keep `README.md`, `SMP_Album_Visualizer.md`, the source header, the `window.DefineScript()` version and release ZIP naming synchronized. A documentation-only correction does not require changing the script version; these files document **v159.6** and were refreshed on November 23, 2026.

The project is an independent community script developed with assistance from OpenAI's ChatGPT. Preserve the repository's existing `AUTHORS.md`, `THIRD_PARTY_NOTICES.md`, `CHANGELOG.md` and `LICENSE` files when preparing a release. The project is licensed under the MIT License; see the repository's `LICENSE` file.
