# Changelog

## 155.0
- Background dark-overlay animation uses a ±40 alpha excursion.
- Animation cycle is 30 seconds.
- Update interval remains 200 ms.
- Overlay animation changes drawing alpha without rebuilding the cached
  blurred background bitmap.

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
- Overlay animation operates without rebuilding the background bitmap/blur
  cache.

## 150.0
- Added Album Artist + Album lookup preference.
- Falls back to Artist + Album when Album Artist is missing.
- Final fallback uses Album only.
- Verifies that the playing handle is represented in the resulting album list.

## 148.0
- Retained cached rounded artwork.
- Added no-cover image caching by path.
- Included effective background blur radius in the background cache key.
- Reviewed remaining GDI bitmap creation so intentional cache builds remain.

## 146.0
- Replaced per-paint track-count badge font creation with cached font creation.
- Improved GDI font resource lifetime.

Earlier revisions are documented in `SMP_Album_Visualizer.md`.
