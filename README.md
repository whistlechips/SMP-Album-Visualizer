# SMP Album Visualizer for foobar2000

**Current script version: v159.6**  
**Documentation updated: November 23, 2026**  
**Target: foobar2000 1.6.x (32-bit) / Spider Monkey Panel 1.6.1**

An album-focused Spider Monkey Panel script combining album artwork, a track list, artist/album information, playback indicators, configurable metadata tooltips and optional visual effects.

See [SMP_Album_Visualizer.md](SMP_Album_Visualizer.md) for the complete configuration reference, source defaults and implementation details.

## What's new in v159.6

**`FORMATS | Track tooltip format`** lets the tooltip show additional tags independently of the track title and subtitle.

- Evaluate the hovered track, even when a different track is playing.
- Use standard foobar2000 title-format expressions and custom tags.
- Add line breaks with `$char(10)` and optional fields with square brackets.
- Apply edits after closing Panel properties, without restarting foobar2000.
- Leave the Property blank to disable tooltips; the blank value survives reloads.
- Cache hovered-row results so animation repaints do not repeat the expression evaluation.

The working panel-drawn tooltip renderer from v159.5 is retained. The tooltip's text and background share the panel's paint cycle.

## Features

- Album artwork with configurable border and corner radius, plus no-cover fallback handling.
- Artwork-derived blurred background with tint and dark-overlay controls.
- Optional slow dark-overlay animation and artwork-colored Floating Lights.
- Artist/album header, track numbers, optional subtitles and a track-count badge.
- Current-track and hover highlighting.
- Eight-band simulated RTA-style animation.
- Configurable album-title, track-title, subtitle and tooltip formats.
- Track-list scrolling, current-track centering and double-click playback.
- Ctrl + wheel font sizing and context-sensitive menus.
- Built-in Help / Documentation and reusable artwork/font/background caches.

The frequency display is simulated; it is not a true FFT/audio-spectrum analyzer. The panel has no seekbar or elapsed-time display.

## Requirements

- **foobar2000 1.6.x, 32-bit**.
- **Spider Monkey Panel 1.6.1**.
- Windows supported by that installation.

The JavaScript is self-contained. Compatibility with other foobar2000/SMP versions is not established by this release.

## Installation or upgrade

1. Back up your current script and customized panel settings.
2. Extract the script release ZIP containing `SMP_Album_Visualizer.js`.
3. Add a Spider Monkey Panel to the foobar2000 layout if needed.
4. Open **Configure...** by right-clicking outside the track list.
5. Replace the entire editor contents with the v159.6 script and apply/save. If the panel loads a script file, select the extracted JS file through that existing configuration instead.
6. Start playback to populate the album view.

Existing saved Properties remain. The new tooltip Property receives its default only when first created. A repository using `SMP_Album_Visualizer.js` as its canonical source filename can retain that name while using the v159.6 contents and declared version.

**This documentation ZIP contains `Readme.md`, `SMP_Album_Visualizer.md` and `CHANGELOG.md` only.** It accompanies the v159.6 script release and does not contain the JavaScript.

## Configure the tooltip

1. Right-click outside the track list and choose **Panel properties...**.
2. Find **FORMATS | Track tooltip format**.
3. Enter a title-format expression and close Properties with **OK**.
4. Hover a track row for approximately half a second.

The default expression shows available Artist, Genre, Date and Composer values:

```text
[Artist: %artist%]$char(10)[Genre: %genre%]$char(10)[Date: %date%]$char(10)[Composer: %composer%]
```

A custom-tag example:

```text
[Genre: %genre%]$char(10)[Style: %style%]$char(10)[Composer: %composer%]
```

The tooltip does not automatically append the track-list subtitle. Its format controls the whole result, independently of subtitle visibility. Optional sections hide absent fields according to foobar2000's rules; empty lines and standalone missing-value markers are removed. Evaluated color controls are stripped, leaving plain text.

Clear the Property to disable tooltips. Empty evaluated results also show no tooltip. Detected compilation/evaluation exceptions are reported once per format change in the console without overwriting the saved expression.

The box wraps at up to 600 pixels and stays inside the panel. Very long text is shortened with an ellipsis if it cannot fit vertically. Move the pointer again after scrolling, resizing or other hover-resetting changes. The technical reference explains the remaining display limits and update behavior.

## Controls

| Action | Behavior |
|---|---|
| Hover a track | Highlight the row and show its configured tooltip after a brief delay. |
| Double-click a track | Play it. |
| Left-click artwork | Center the playing track, subject to the centering setting. |
| Mouse wheel | Scroll the album track list. |
| Ctrl + wheel over Artist/Album | Adjust the paired header font scales. |
| Ctrl + wheel over Track/Subtitle | Adjust track/subtitle sizing. |
| Right-click a track | Open its foobar2000 context menu. |
| Right-click elsewhere | Open Help / Resources and panel commands. |

## Configuration

Settings are grouped by prefixes in the normal SMP Properties dialog:

| Category | Controls |
|---|---|
| `ANIMATION` | Frequency-bar updates and Floating Lights. |
| `ARTWORK` | Artwork area, border, corners and no-cover fallback. |
| `BACKGROUND` | Blur, tint, dark overlay and overlay animation. |
| `COLORS` | Text, track-number, current-track and hover colors. |
| `FONTS` | Header and track font choices. |
| `FORMATS` | Album title, track title, subtitle and track tooltip expressions. |
| `LAYOUT` | Margins, header spacing and track geometry. |
| `NAVIGATION` | Current-track centering and wheel row count. |
| `TEXT` | Artist, album and track scales plus header spacing. |
| `TRACK` | Subtitle and track-count-badge visibility. |

Important source defaults:

| Property | Default |
|---|---|
| `ANIMATION \| EQ / frequency bars timer interval (ms)` | `40` |
| `ANIMATION \| EQ / frequency bars enable` | `true` |
| `ANIMATION \| Floating lights enable` | `true` |
| `ANIMATION \| Floating lights number (4-100)` | `60` |
| `ANIMATION \| Floating lights brightness (0.25-5.0)` | `3` |
| `ANIMATION \| Floating lights size (0.25-2.5)` | `0.4` |
| `BACKGROUND \| Animate dark overlay` | `true` |

Saved values take precedence over defaults. Color Properties use `R,G,B,A`, with alpha 0 transparent and 255 opaque. Full defaults and formatting details are in [SMP_Album_Visualizer.md](SMP_Album_Visualizer.md).

## Album discovery and visual effects

The Media Library is preferred for album membership; the active playlist is used when the library is unavailable or empty. Album matching tries Album Artist + Album, then Artist + Album, then Album-only, and retains the playing handle when needed.

The blurred background comes from artwork. Overlay animation varies drawing alpha while leaving the saved overlay value unchanged. Floating Lights are drawn over the wallpaper and behind artwork/text. These animations are gated by playback state and suspended around relevant modal dialogs.

## Help and troubleshooting

Right-click outside the track list and choose **Help / Documentation**. No external viewer is needed. The menu also offers documentation links, Reload, Open component folder, Panel properties... and Configure....

If no tooltip appears, check that its Property is nonblank and the hovered track produces a nonempty result. Try the default expression, allow the brief hover delay, and ensure the panel has enough room for a tooltip. Check the foobar2000 console for reported tooltip exceptions.

## Verification status

JavaScript syntax and mock-host regression checks passed for v159.6. These checks cover the new Property, caching, hovered-track selection, error handling, dialog synchronization and the existing overlay/mouse interactions. They do not replace Windows/foobar2000 runtime testing.

Panel-drawn tooltip display was confirmed working in v159.5. Extended runtime testing of v159.6 is pending before GitHub publication.

## Documentation and maintenance

- [Readme.md](Readme.md): overview, installation and common controls.
- [SMP_Album_Visualizer.md](SMP_Album_Visualizer.md): complete property reference, tooltip formatting, technical behavior, limits and regression checklist.
- [CHANGELOG.md](CHANGELOG.md): documented revision history through v159.6.
- Repository `AUTHORS.md` and `THIRD_PARTY_NOTICES.md`: authorship, development provenance and third-party notices.

Keep the source version, documentation and release archive naming synchronized. These documents describe **v159.6**; their November 23, 2026 refresh does not change the script version.

## Provenance and license

SMP Album Visualizer is an independent community script developed with assistance from OpenAI's ChatGPT during design, debugging, refactoring, documentation and test analysis.

The project is licensed under the **MIT License**; see the repository's `LICENSE` file. Preserve the repository's `LICENSE`, `AUTHORS.md` and `THIRD_PARTY_NOTICES.md` files when preparing a release.
