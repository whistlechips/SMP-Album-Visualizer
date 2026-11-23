# Changelog

**Current script version:** v159.6  
**Documentation updated:** November 23, 2026  
**Target:** foobar2000 1.6.x (32-bit) / Spider Monkey Panel 1.6.1

This file records documented project changes in reverse version order. Entries for development revisions describe the outcome of each revision, including corrections superseded by later versions. The current implementation is documented in [SMP_Album_Visualizer.md](SMP_Album_Visualizer.md); installation and an overview are in [README.md](README.md).

## Documentation update — November 23, 2026

- Updated `SMP_Album_Visualizer.md` and `README.md` to describe v159.6 consistently.
- Checked all 46 current Property names and source defaults against the v159.6 script.
- Added the independent tooltip-format instructions, examples, display limits and validation status.
- Corrected stale version labels and defaults in the older documents.
- Updated `CHANGELOG.md` through v159.6 while retaining the recorded earlier history.
- Included all three Markdown files in the complete documentation ZIP. This documentation refresh does not change the script version.

## v159.6 — Configurable track tooltip format — November 22, 2026

### Added

- Added `FORMATS | Track tooltip format` to control the complete tooltip independently of the track title, subtitle format and subtitle visibility.
- Set the default expression to display available Artist, Genre, Date and Composer fields:

  ```text
  [Artist: %artist%]$char(10)[Genre: %genre%]$char(10)[Date: %date%]$char(10)[Composer: %composer%]
  ```

- Supported custom tag fields and multiline expressions using standard foobar2000 title formatting.
- Evaluated the expression against the hovered track, which may differ from the playing track.
- Allowed an empty or whitespace-only Property to disable tooltips, retaining that value across reloads.

### Changed

- Compiled the expression at initialization and when the saved format changes.
- Cached the hovered-row result, including an empty result, to avoid evaluation during repeated mouse movement or animation repaints.
- Removed empty lines and standalone missing-value markers from the displayed result; retained color-control removal and Unicode handling.
- Synchronized the new Property after Properties or Configure closes, allowing changes without restarting foobar2000.
- Suppressed tooltips on detected compilation/evaluation exceptions, logged once per format change, and retained the saved expression for correction.
- Retained the working v159.5 panel-drawn tooltip renderer, hover delay, wrapping, panel boundaries and existing mouse controls.
- Updated built-in Help with a Track Tooltip Format section.

### Validation

- JavaScript syntax and mock-host regression checks passed for the new Property and retained tooltip behavior.
- Extended runtime testing of v159.6 is pending before GitHub publication.

## v159.5 — Tooltips drawn inside the panel — November 22, 2026

- Replaced the separate native Windows tooltip window with an overlay drawn after the panel content.
- Drew the opaque tooltip background, border and text in the same paint cycle as the panel, including animation repaints.
- Addressed the intermittent shadow-only tooltip display observed during playback with the native implementation.
- Retained an approximately 450 ms hover delay, plain-text formatting, Unicode support and wrapping up to 600 pixels.
- Kept the tooltip within panel boundaries, shortening exceptionally long text with an ellipsis when it cannot fit vertically.
- Cached the tooltip layout and cleared it on the existing navigation, layout, menu/dialog and unload paths.
- Updated built-in Help and installation instructions.
- Panel-drawn tooltip display was confirmed working during playback, pause and stop.

## v159.4 — Native tooltip activation correction — November 22, 2026

- Revised the activation sequence to enable the native tooltip window and register its tracking flags through a text update before requesting tracking display.
- Added one-time console reporting for tooltip exceptions instead of silently suppressing all failures.
- Improved the mock-host checks to model separate native-window activation and tracking state.
- Paused display worked again, but intermittent shadow-only display remained during playback. The native renderer was subsequently replaced in v159.5.

## v159.3 — Native tracking tooltip attempt — November 22, 2026

- Added an explicit 450 ms hover delay and native tracking display to address tooltips appearing only while playback was paused.
- Canceled pending hover timeouts when leaving a row, scrolling, switching targets or opening menus/dialogs.
- This revision failed to display tooltips in runtime testing. Its activation sequence was corrected in v159.4; its native renderer was superseded by v159.5.

## v159.2 — Initial track tooltips — November 22, 2026

- Added hover tooltips showing the full formatted track title and the enabled subtitle from the track list.
- Removed title-format color controls from tooltip text while preserving Unicode and punctuation.
- Added multiline wrapping and avoided repeated activation while hovering the same unchanged row.
- Cleared tooltip state on leaving, scrolling, resizing, album/layout changes, menus/dialogs and unload.
- Updated built-in Track List Help and packaged the script with Help and installation instructions.
- Runtime testing found that tooltips appeared while paused but not during active playback, prompting the subsequent corrections.

## v158.0 — Color alpha rendering fix

- Fixed translucent text rendering for color Properties by rendering text to an off-screen bitmap and compositing it with the configured alpha. This addresses GDI text drawing paths that do not honor the alpha byte in the supplied color value.
- Routed formatted track-title color runs through the same alpha-aware text renderer.
- Left existing RGB values and default opaque rendering unchanged.

## v156.0 — Stable baseline

- Established `156.0` consistently across the script and documentation.
- Removes the ambiguous `Version 2.0` source-header label; the script header now names release version `156.0` and `window.DefineScript()` declares `156.0`.
- Consolidates Floating Lights behavior: enabled by default, 60 particles by default, brightness `3`, and size `0.4`.
- Uses artwork-derived accent colors and warm-neutral sparks.
- Gives each particle independent horizontal drift with gradual random direction changes and occasional stronger sideways movement.
- Applies an RGB brightness floor of 178 to sampled artwork colors only when their strongest channel is below 178, scaling channels proportionally to preserve hue. The adjustment is not repeated on every animation tick.
- Retains the 40 ms EQ/frequency-bars timer default.
- Retains the optional slow dark-overlay animation and cached blurred-background handling.
- Includes the corrected Properties naming and cleanup for renamed/placeholder properties.
- Runtime testing completed, as confirmed by the project owner.

## v155.0

- Added and refined Floating Lights over the blurred wallpaper layer.
- Added Properties for enable/disable, particle count, brightness, and size.
- Added artwork-derived particle colors and improved particle motion.
- Improved Properties/Configure animation handling and background redraw behavior.

## v154.0

- Background dark-overlay animation cycle changed to 24 seconds.

## v153.0

- Background dark-overlay animation range changed to ±40 alpha.
- Animation cycle set to 16 seconds.

## v152.0

- Background dark-overlay animation range changed to ±24 alpha.
- Animation cycle set to 16 seconds.

## v151.0

- Added `BACKGROUND | Animate dark overlay`.
- Overlay animation reuses the cached blurred background bitmap.

## v150.0

- Added Album Artist + Album lookup preference.
- Falls back to Artist + Album when Album Artist is missing.
- Final fallback uses Album only.
- Verifies that the playing handle is represented in the resulting album list.

## v148.0

- Retained cached rounded artwork.
- Added no-cover image caching by path.
- Included effective background blur radius in the background cache key.
- Reviewed GDI bitmap creation and cache lifetimes.

## v146.0

- Replaced per-paint track-count badge font creation with cached font creation.
- Improved GDI font resource lifetime.

For revisions without a detailed entry here, consult the repository history. No undocumented release details have been inferred.
