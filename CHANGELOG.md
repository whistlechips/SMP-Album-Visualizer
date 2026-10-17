# Changelog

This file records notable project revisions. v156.0 is the current stable baseline; runtime testing of this baseline has been completed by the project owner.

## 156.0 — Stable baseline

- Establishes `156.0` as the current release version across the script and documentation.
- Removes the ambiguous `Version 2.0` source-header label; the script header now names release version `156.0` and `window.DefineScript()` declares `156.0`.
- Consolidates Floating Lights behavior: enabled by default, 60 particles by default, brightness `3`, and size `0.4`.
- Uses artwork-derived accent colors and warm-neutral sparks.
- Gives each particle independent horizontal drift with gradual random direction changes and occasional stronger sideways movement.
- Applies an RGB brightness floor of 178 to sampled artwork colors only when their strongest channel is below 178, scaling channels proportionally to preserve hue. The adjustment is not repeated on every animation tick.
- Retains the 40 ms EQ/frequency-bars timer default.
- Retains the optional slow dark-overlay animation and cached blurred-background handling.
- Includes the corrected Properties naming and cleanup for renamed/placeholder properties.
- Runtime testing completed, as confirmed by the project owner.

## 155.0

- Added and refined Floating Lights over the blurred wallpaper layer.
- Added Properties for enable/disable, particle count, brightness, and size.
- Added artwork-derived particle colors and improved particle motion.
- Improved Properties/Configure animation handling and background redraw behavior.

## 154.0

- Background dark-overlay animation cycle changed to 24 seconds.

## 153.0

- Background dark-overlay animation range changed to ±40 alpha.
- Animation cycle set to 16 seconds.

## 152.0

- Background dark-overlay animation range changed to ±24 alpha.
- Animation cycle set to 16 seconds.

## 151.0

- Added `BACKGROUND | Animate dark overlay`.
- Overlay animation reuses the cached blurred background bitmap.

## 150.0

- Added Album Artist + Album lookup preference.
- Falls back to Artist + Album when Album Artist is missing.
- Final fallback uses Album only.
- Verifies that the playing handle is represented in the resulting album list.

## 148.0

- Retained cached rounded artwork.
- Added no-cover image caching by path.
- Included effective background blur radius in the background cache key.
- Reviewed GDI bitmap creation and cache lifetimes.

## 146.0

- Replaced per-paint track-count badge font creation with cached font creation.
- Improved GDI font resource lifetime.

Earlier revisions are documented in `SMP_Album_Visualizer.md` where known.
