# SMP Album Visualizer for Foobar2000

**Current script baseline:** v155.0\
**Authoritative implementation:** `SMP_Album_Visualizer.js`\
**Target environment:** Spider Monkey Panel 1.6.1 / foobar2000 1.6.x
32-bit

This document is the maintained human-readable project reference. The
JavaScript source is authoritative for implementation details, defaults,
and behavior.

------------------------------------------------------------------------

## 1. Overview

SMP Album Visualizer for Foobar2000 presents the currently playing album
as a visual album and track display.

Current features:

-   Album artwork with configurable rounded artwork corners.
-   Artwork-derived blurred background with tint and dark overlay.
-   Album and artist header typography with paired sizing.
-   Track list with track numbers, titles, and optional subtitle/tag
    line.
-   Current-track and hover indicators.
-   Album track-count badge.
-   Eight-band simulated RTA-style frequency animation.
-   Configurable frequency-animation timer.
-   Configurable subtitle title-format expression.
-   Automatic current-track centering.
-   Mouse-wheel track-list navigation.
-   Context-sensitive Help / Resources menu.
-   Built-in Help / Documentation.

------------------------------------------------------------------------

## 2. User Interaction

### Album Artwork

**Left-clicking the album artwork centers the currently playing track in
the Album Visualizer track list.**

This uses the panel's `centerCurrentTrack()` function rather than the
global foobar2000 `View/Show Now Playing in playlist` command.

### Track List

-   Hovering a track updates the hover indicator and cursor.
-   Double-clicking a displayed track plays that track.
-   Right-clicking within the track list retains the normal foobar2000
    track context menu.

### Mouse Wheel

Mouse-wheel movement scrolls the Album Visualizer track list according
to `NAVIGATION | Mouse wheel rows`.

### Right-Click / Help Menu

Everywhere **except the track list**, right-click opens:

``` text
Help / Documentation
────────────────────────
Spider Monkey Panel Documentation
Title Formatting Reference
Query Syntax
────────────────────────
Homepage
Components
Wiki
Forums
────────────────────────
Reload
Open component folder
Panel properties...
Configure...
```

------------------------------------------------------------------------

## 3. Properties

Properties are pseudo-categorized using category prefixes.

Numeric Properties are stored internally as text-backed values and
converted to numbers by the script. This prevents the SMP Properties
dialog from entering an unsafe blank numeric state. Blank values are
restored to their documented defaults, except where blank is explicitly
meaningful (currently `ARTWORK | No cover image path`).

### ANIMATION

  Property                                   Default
  ------------------------------------------ ---------
  `EQ / frequency bar timer interval (ms)`   `40`
  `Show animated frequency bars`             `true`

### ARTWORK

  Property                        Default
  ------------------------------- --------------------
  `Artwork area width ratio`      `0.46`
  `Artwork border`                `'255,255,255,25'`
  `Artwork corner radius ratio`   `0.04`
  `Artwork top ratio`             `0.12`
  `No cover image path`           `''`
  `No cover text`                 `'NO COVER'`

### BACKGROUND

  Property                     Default
  ---------------------------- -----------------
  `Background - purple tint`   `'36,31,54,42'`
  `Background blur radius`     `48`
  `Background dark overlay`    `'0,0,0,125'`
  `Animate dark overlay`       `false`

### COLORS

  Property                           Default
  ---------------------------------- ---------------------
  `Album text`                       `'211,209,216,255'`
  `Artist text`                      `'248,248,249,255'`
  `Current track background color`   `'255,255,255,70'`
  `Font text`                        `'215,214,220,255'`
  `Hover background color`           `'255,255,255,70'`
  `Muted text`                       `'130,128,137,255'`
  `Subtitle text`                    `'185,182,191,255'`
  `Track text`                       `'215,214,220,255'`

### FONTS

  Property              Default
  --------------------- ----------------------------
  `Artist font`         `'Roboto Condensed Bold'`
  `Artist font style`   `1`
  `Font`                `'Roboto Condensed Light'`

### FORMATS

  ------------------------------------------------------------------------------
  Property                      Default
  ----------------------------- ------------------------------------------------
  `Album title format`          `'%album%'`

  `Track title format`          `'$if($stricmp(%album artist%,Various Artists`
  ------------------------------------------------------------------------------

### LAYOUT

  Property                     Default
  ---------------------------- ---------
  `Header height ratio`        `0.105`
  `Header left margin`         `0.115`
  `Outer margin`               `0.040`
  `Track gap ratio`            `0.014`
  `Track list left margin`     `0.050`
  `Track number width ratio`   `0.040`

### NAVIGATION

  Property                               Default
  -------------------------------------- ---------
  `Center current track automatically`   `true`
  `Mouse wheel rows`                     `3`

### TEXT

  Property                     Default
  ---------------------------- ---------
  `Artist / Album title gap`   `24`
  `Artist font scale`          `1.14`
  `Track font scale`           `0.90`

Font scaling is intentionally paired: - Artist and Album use the same
scale and change together. - Track and Subtitle use the same scale and
change together. - Ctrl + mouse wheel over either member of a pair
changes that shared scale by 0.1. - The nominal scale range is 0.5
through 2.0. The Track scale may stop below 2.0 when the 30 px Track
font-size ceiling is reached, and the shared Artist/Album scale may stop
below 2.0 when the 52 px Artist font-size ceiling is reached.

### TRACK

  Property                   Default
  -------------------------- ----------------
  `Show subtitle/tag line`   `true`
  `Show track count badge`   `true`
  `Subtitle title format`    `'%subtitle%'`

------------------------------------------------------------------------

## 4. Artwork

Album artwork is displayed in the configured artwork area.

`ARTWORK | Artwork corner radius ratio` controls the rounded corners of
the album artwork itself. There is no panel-wide corner-radius Property.

Left-clicking the artwork centers the currently playing track in the
panel's own track list.

------------------------------------------------------------------------

## 5. Background

The visual background is derived from album artwork and can be blurred,
tinted, and darkened with an overlay.

`BACKGROUND | Animate dark overlay` optionally adds a very slow, subtle
breathing effect while playback is active. It varies only the alpha used
to draw the dark overlay; the configured
`BACKGROUND | Background dark overlay` Property is never modified. The
effect uses a ±24 alpha excursion, a 16-second cycle, and a 200 ms
update interval. The cached blurred bitmap is not rebuilt for this
effect.

The former background-gradient Properties (`Background - top` and
`Background - bottom`) are not part of the current implementation.

------------------------------------------------------------------------

## 6. Header and Track List

Album and artist text use paired font scales, with their bottoms
aligned.

Tracks can display:

-   track number;
-   title;
-   optional subtitle/tag line; and
-   current/hover state indicators.

The track-count badge displays the number of tracks on the album.

------------------------------------------------------------------------

## 7. Subtitle / Secondary Track Line

The subtitle line is controlled by:

`TRACK | Show subtitle/tag line`

When enabled, its content is generated from:

`TRACK | Subtitle title format`

The default is:

``` text
%subtitle%
```

This Property accepts any foobar2000 title-format expression. Examples:

``` text
%genre%
%date%
%style%
$if(%genre%,%genre%,%style%)
```

------------------------------------------------------------------------

## 8. Track Title Formatting

`FORMATS | Track title format` uses foobar2000 title-format syntax.

`FORMATS | Album title format` controls the album title display.

------------------------------------------------------------------------

## 9. Current-Track Indicator

The current-track indicator identifies the playing track in the
displayed album list.

The indicator animation runs only while playback is active. It stops
when playback is paused or stopped.

The current-track background and hover background have independent color
Properties.

------------------------------------------------------------------------

## 10. Frequency / RTA-Style Animation

The visualizer contains eight simulated frequency bands:

    Bar Frequency       Motion
  ----- --------------- ----------------------
      1 20--60 Hz       Slow, heavy
      2 60--120 Hz      Somewhat slower bass
      3 120--250 Hz     Low-mid
      4 250--500 Hz     Mid
      5 500 Hz--1 kHz   More active mid
      6 1--2 kHz        Quicker upper-mid
      7 2--5 kHz        Faster presence
      8 5--20 kHz       Fastest

The display is a **simulated RTA-style visualization**, not a true audio
FFT analyzer. The upper two bands can occasionally produce short
transient peaks to suggest cymbal/crash events.

Bass and mid-bass have greater apparent height/energy. Treble has
substantially less apparent height while movement becomes faster toward
the high-frequency end.

The frequency animation runs only while playback is active:

-   **Playing:** bars animate.
-   **Paused:** bars stop.
-   **Stopped:** bars stop.
-   **Mouse movement:** does not animate the bars.
-   **Panel repaint:** does not advance the animation.

Animation state is updated by the frequency timer and is not modified by
the drawing routine.

`ANIMATION | EQ / frequency bar timer interval (ms)` controls the update
interval. The current default is **40 ms**.

When a very small interval is selected, the animation simulation can
update more frequently, but repainting is throttled and limited to the
small EQ-bar rectangle instead of invalidating the entire panel. This
reduces GDI/UI work and helps preserve mouse clicks and context-menu
responsiveness.

`ANIMATION | Show animated frequency bars` turns the frequency animation
on or off.

The bars use the `COLORS | Muted text` color.

------------------------------------------------------------------------

## 11. Context Menu and Help

The custom right-click menu is available everywhere except the track
list.

### Built-in Help

`Help / Documentation` opens the condensed built-in Help directly
through Spider Monkey Panel's `fb.ShowPopupMessage()` facility. No
external Markdown viewer, browser, or other program is required.

### External Resources

The menu provides:

-   Spider Monkey Panel Documentation
-   Title Formatting Reference
-   Query Syntax
-   foobar2000 Homepage
-   Components
-   Wiki
-   Forums

### Panel Commands

The menu also provides:

-   Reload
-   Open component folder
-   Panel properties...
-   Configure...

------------------------------------------------------------------------

## 12. Current-State Boundaries

The following are intentionally **not** part of the current
implementation:

-   Panel-wide corner-radius Property.
-   Background top/bottom gradient Properties.
-   `P.background`.
-   The former Boolean `TRACK | Subtitle source is %subtitle%`.
-   Seven-bar frequency animation.
-   Sequential right-to-left frequency-bar wave.
-   Hard-coded white/alpha track-count badge coloring.
-   Actual FFT/audio-frequency analysis.
-   Audio-reactive background animation; the current background effect
    is only a slow overlay-alpha oscillation.

Earlier temporary Properties and experimental implementations have been
removed and are not part of the current configuration.

------------------------------------------------------------------------

## 13. Development / Maintenance Notes

### Versioning

The `window.DefineScript()` version is updated with every generated
revision and must match the current script revision.

For v113:

``` javascript
window.DefineScript('SMP Album Visualizer', {
    author: 'OpenAI',
    version: '113.0',
```

The filename, ZIP filename, and source version should remain
synchronized.

### Help Maintenance

The built-in `const HELP` structure is part of the user interface. Any
change that affects user interaction with the panel must also update the
relevant Help content.

### Reference Maintenance

This Markdown document should be updated as the project progresses. The
current JavaScript source remains the authoritative implementation
reference.

------------------------------------------------------------------------

## 14. Revision Notes

Revision entries are listed newest first. Each entry records a
substantive development revision; obsolete experiments and intermediate
troubleshooting steps are retained only where they document a meaningful
implementation change.

### Revision 155.0

-   Retained the ±40 alpha excursion introduced in v153.0.
-   Lengthened the background overlay animation cycle from 16 seconds to
    30 seconds so the same overall brightness range is traversed more
    gradually.
-   Kept the 200 ms update interval unchanged; each animation step is
    therefore smaller without increasing repaint frequency.
-   The configured `BACKGROUND | Background dark overlay` Property
    remains unchanged.
-   The cached blurred background bitmap is still reused; no additional
    bitmap creation or blur processing occurs during the animation.

### Revision 154.0

-   Retained the ±40 alpha excursion introduced in v153.0.
-   Lengthened the background overlay animation cycle from 16 seconds to
    24 seconds so the same overall brightness range is traversed more
    gradually.
-   Kept the 200 ms update interval unchanged; each animation step is
    therefore smaller without increasing repaint frequency.
-   The configured `BACKGROUND | Background dark overlay` Property
    remains unchanged.
-   The cached blurred background bitmap is still reused; no additional
    bitmap creation or blur processing occurs during the animation.

### Revision 153.0

-   Increased the optional `BACKGROUND | Animate dark overlay` alpha
    excursion from ±24 to ±40 to make the slow background breathing
    effect clearly perceptible.
-   Retained the 16-second animation cycle.
-   Kept the 200 ms update interval unchanged; no additional repaint
    frequency was introduced.
-   The configured `BACKGROUND | Background dark overlay` Property
    remains unchanged.
-   The cached blurred background bitmap is still reused; no additional
    bitmap creation or blur processing occurs during the animation.

### Revision 152.0

-   Increased the optional `BACKGROUND | Animate dark overlay` alpha
    excursion from ±10 to ±24.
-   Shortened the animation cycle from 20 seconds to 16 seconds so the
    effect is more readily perceptible while remaining slow and gentle.
-   Kept the 200 ms update interval unchanged; no additional repaint
    frequency was introduced.
-   The configured `BACKGROUND | Background dark overlay` Property
    remains unchanged.
-   The cached blurred background bitmap is still reused; no additional
    bitmap creation or blur processing occurs during the animation.

### Revision 151.0

-   Added optional `BACKGROUND | Animate dark overlay`, disabled by
    default.
-   When enabled, the dark overlay alpha gently oscillates by ±10 around
    the user's configured alpha.
-   The animation uses a 20-second cycle and a 200 ms update interval.
-   The user's `BACKGROUND | Background dark overlay` Property is never
    modified.
-   The cached blurred background bitmap is reused; no additional bitmap
    creation or blur processing occurs during the animation.
-   The animation runs only while playback is active and stops on
    pause/stop.
-   Properties and Configure dialogs temporarily stop the background
    animation timer and resume it afterward when appropriate.
-   Built-in Help was updated to document the new background animation.
-   No changes were made to the frequency-bar simulation or its repaint
    strategy.

### Revision 150.0

-   Hardened album-track discovery for incomplete or inconsistent
    metadata.
-   Album Artist + Album remains the preferred album query.
-   When Album Artist is unavailable, Artist + Album remains the normal
    fallback.
-   Album-only remains the final discovery fallback when the more
    specific queries cannot produce a result.
-   Added a final invariant: the currently playing handle is always
    present in `albumTracks`, even when a metadata-based query returns a
    set that does not contain that handle.
-   This prevents the visualizer from losing the playing track---and
    therefore its current-track indicator and frequency-bar
    display---because of incomplete or inconsistent Album Artist
    metadata.
-   No user Properties were added or changed.
-   No changes were made to animation timing, artwork caching, font
    handling, layout, or Properties-dialog handling.
-   Revision 148 remains the performance/stability baseline; Revision
    150 adds only the metadata-resilience change described above.

### Revision 148.0

-   Stability hardening based on the successful Revision 147 test.
-   Reviewed the remaining `gdi.CreateImage()` calls in the paint/render
    paths.
-   Retained the Revision 147 rounded-artwork cache; no changes were
    made to the frequency-bar simulation, 40 ms default timer interval,
    repaint strategy, subtitle handling, layout, or font scaling
    behavior.
-   Added caching for a user-specified `ARTWORK | No cover image path`,
    so the same external no-cover bitmap is not reloaded for every track
    lacking artwork.
-   Added the effective background blur radius to the blurred-background
    cache key. Changing `BACKGROUND | Background blur radius` therefore
    correctly invalidates/rebuilds the cached background instead of
    continuing to use an image rendered with the previous radius.
-   Confirmed that the remaining bitmap allocations are intentional
    cache-build operations rather than per-animation-paint allocations:
    -   rounded artwork and its temporary mask are created only when the
        artwork, size, or radius changes;
    -   the blurred background is created only when the artwork, panel
        dimensions, or effective blur radius changes;
    -   the built-in no-cover image is created once and retained;
    -   a user-specified no-cover image is now loaded once per path and
        retained.
-   No explicit GDI bitmap disposal call was introduced; the
    implementation continues to release graphics contexts and drops
    obsolete bitmap references so they can be reclaimed by the
    SMP/JavaScript runtime.
-   The successful Revision 147 result---previously problematic `Psy`
    and other albums remaining stable with frequency animation
    enabled---is preserved as the baseline for this hardening revision.

### Revision 147.0

-   v146 did not change the lock-up behavior, so the font-resource
    hypothesis is not sufficient to explain the problem.
-   Moved rounded album-art generation out of the recurring paint path.
    The previous implementation created a new artwork bitmap and a new
    mask bitmap on every repaint, including the frequent repaints caused
    by the frequency animation.
-   The rounded artwork is now cached by artwork object, displayed size,
    and corner radius and reused across paints.
-   The temporary mask is released by dropping its JavaScript reference
    immediately after `ApplyMask()`.
-   The cached artwork render is invalidated when artwork changes, the
    panel is resized, or the script unloads.
-   This revision preserves the visual result and is specifically
    intended to isolate sustained GDI bitmap allocation /
    garbage-collection pressure from the animation timer itself.

### Revision 146.0

-   Fixed a GDI font-resource leak in the album track-count badge.
-   The badge was creating new `Roboto` and `Segoe Fluent Icons` font
    objects directly on every panel paint. With animated frequency-bar
    repaints, this could create a large number of GDI font objects and
    eventually make foobar2000's UI unresponsive while playback
    continued.
-   Badge fonts now use the existing shared font cache, so repeated
    paints reuse the same GDI font objects.
-   The no-cover icon font was also routed through the shared font cache
    for consistent font lifetime management.
-   Preserved the existing 40 ms animation interval and all v144 font
    scaling, subtitle, artwork, layout, and Properties behavior.
-   This revision specifically targets the resource-lifetime finding
    from the intermittent UI lock-up investigation.

### Revision 144.0

-   Corrected the Artist/Album practical font-scale limit introduced in
    v143.
-   The shared Artist/Album scale is now limited by the actual Artist
    font-size ceiling (52 px), rather than the Album font-size ceiling.
-   This prevents Ctrl + mouse-wheel changes from incorrectly forcing
    the Artist scale down to the Album-derived value.
-   The Album font retains its existing 36 px draw-time ceiling and does
    not constrain further Artist scaling.
-   Manual Property values and Ctrl + mouse-wheel scaling now use the
    same Artist-based practical maximum.
-   No changes were made to Track/Subtitle scaling, adaptive Track row
    height, font persistence, dialog handling, animation, or v143/v142
    stability fixes.

### Revision 143.0

-   Fixed the practical maximum for the shared Artist/Album font scale.
-   Ctrl + mouse wheel now stops when the Artist or Album font reaches
    its actual font-size ceiling, rather than continuing to change the
    stored scale after the visible font has stopped growing.
-   The same practical maximum is applied when synchronizing the
    `TEXT | Artist font scale` Property after the Properties dialog
    closes.
-   The maximum is calculated from the current panel height and the
    existing 52 px Artist / 36 px Album font-size ceilings; it is not
    hard-coded to a particular panel size.
-   No changes were made to Track/Subtitle scaling, adaptive Track row
    height, font persistence, dialog handling, animation, or the v142
    diagnostic logging behavior.

### Revision 142.0

-   Diagnostic `console.log` output is disabled in the normal release
    build.
-   Existing `debugLog()` calls are retained but gated by
    `DEBUG_LOGGING = false`, so they can be re-enabled if future
    troubleshooting requires them.
-   No functional behavior was changed.

### Revision 141.0

-   Refined Track title vertical allocation to address slight clipping
    of `g`, `p`, `q`, and `y` at larger Track font scales.
-   When the Subtitle line is enabled, the Track title area now has a
    small minimum height based on the actual Track font size, while
    retaining the compact 61% row allocation whenever it is sufficient.
-   No changes were made to Property validation, font-scale persistence,
    dialog handling, animation timers, or the existing adaptive
    row-height calculation.

### Revision 140.0

-   Completed the Property-table audit for blank-value safety.
-   All editable numeric Properties are now stored as strings and
    converted to numbers for internal use.
-   Older numeric-backed values are automatically migrated to the
    string-backed representation.
-   Blank numeric values are restored to their documented defaults
    before use.
-   Non-numeric values supplied to numeric Properties are also rejected
    and replaced with the documented defaults.
-   Existing font-scale validation remains in place.
-   `ARTWORK | No cover image path` remains the intentional blank-value
    exception.
-   No row-height or dialog/lockup behavior was otherwise changed.

### Revision 139.0

-   Added centralized validation for user-facing Properties that must
    not be blank.
-   Blank values are immediately restored to each property's documented
    default before they can reach drawing, font, layout, timer, color,
    or title-format code.
-   `ARTWORK | No cover image path` remains intentionally allowed to be
    blank.
-   Added diagnostic `Property BLANK` console logging when an invalid
    blank value is recovered.
-   Retained v138 font-scale property handling and v137 lockup-related
    persistence behavior.

### Revision 137.0

-   Font-scale wheel changes are now persisted with a short 250 ms
    debounce instead of writing an SMP Property on every wheel event.
-   Repeated wheel events that do not change the effective scale (for
    example, continuing upward after the Track scale has reached its
    maximum) are now ignored without rebuilding fonts or requesting a
    repaint.
-   Any pending font-scale save is flushed once immediately before
    opening Properties or Configure, preventing a delayed wheel save
    from overwriting values edited in the dialog.
-   Added diagnostic logging around the deferred font-scale Property
    save and no-op scale changes.
-   The row-height and descender adjustment from Revision 130 remains
    unchanged.

### Revision 136.0

-   Diagnostic isolation for the intermittent foobar2000 display lockup
    after repeated font-scale changes followed by **Panel
    properties...** or **Configure...**.
-   Removed the synchronous full-panel `window.Repaint()` immediately
    after `window.ShowProperties()` returns.
-   Removed the corresponding synchronous full-panel `window.Repaint()`
    after `window.ShowConfigureV2()` returns.
-   The existing synchronization of font-scale Properties and animation
    restart behavior is unchanged.
-   Added diagnostic messages confirming that the post-dialog repaint is
    intentionally skipped.
-   The purpose of this revision is to isolate whether the post-modal
    full-panel repaint is contributing to the observed UI lockup; no
    other functional changes were made.

### Revision 135.0

-   Added diagnostic logging around font-triggered repaint requests and
    coalescing.
-   Font-scale changes now coalesce multiple rapid repaint requests
    through a zero-delay callback instead of issuing a full
    `window.Repaint()` for every mouse-wheel event.
-   A pending font repaint is cancelled before opening Properties so the
    dialog is not entered with a queued font repaint.
-   This revision is diagnostic and targets the observed delayed
    Properties return / FB2K freeze after repeated font-scale
    adjustments.

### Revision 134.0

-   Added diagnostic `console.log` tracing around Ctrl + mouse-wheel
    font scaling, font-scale adjustments, right-click handling,
    popup-menu entry/return, Properties/Configure invocation and return,
    font-scale synchronization, and playback/timer stop events.
-   Logging is limited to interaction and timer lifecycle events;
    individual animation ticks are not logged.
-   No functional change to the row-height calculation or dialog
    behavior; this revision is intended to capture the sequence leading
    to delayed dialogs or right-click lockups.

### Revision 133.0

-   Increased the maximum adaptive row-height allowance from 6 to 8
    pixels to provide additional descender headroom above the default
    Track scale of 0.90.
-   Track row height remains unchanged at 0.90 and continues to decrease
    when the Track scale is reduced.
-   Mouse-wheel font-scale changes are now written to the corresponding
    SMP Property immediately rather than after a delayed 180 ms save.
-   This prevents a pending wheel-save operation from overwriting a
    value while the user is editing `TEXT | Track font scale` in the
    Properties dialog.
-   After the Properties dialog closes, the Artist and Track font-scale
    values are read back from SMP Properties and applied immediately
    without requiring a panel reload.
-   Panel animation timers are stopped while the SMP Properties or
    Configure modal dialog is open and restarted afterward when playback
    is active.
-   Properties and Configure are now opened directly after
    `TrackPopupMenu()` returns rather than through another delayed
    callback, reducing nested message-loop/repaint interaction that
    could contribute to foobar2000 display lockups.

### Revision 132.0

-   Fixed a potential display lockup when selecting **Panel
    properties...** or **Configure...** from the right-click Help /
    Resources menu.
-   Both SMP modal dialogs are now deferred by 150 ms so the Windows
    popup-menu/message loop and the `on_mouse_rbtn_up` callback have
    completely returned before the dialog is opened.
-   `Configure...` now uses `window.ShowConfigureV2()`, the current SMP
    API; the older `window.ShowConfigure()` API is deprecated.
-   Frequency-bar and track-indicator popup protection from v131 is
    retained.

### Revision 131.0

-   Added popup-menu activity protection so the frequency-bar and
    current-track indicator timers do not repaint the panel while a
    Windows popup/context menu is active.
-   Right-click menu handling now clears the popup-active state even if
    menu invocation raises an exception.
-   A panel repaint is requested after the custom Help / Resources menu
    closes.
-   This change addresses intermittent right-click UI lockups observed
    in v129/v130.

### Revision 130.0

-   Increased maximum adaptive Track row-height allowance from 5 to 6
    pixels to provide additional descender clearance at the maximum
    usable Track scale.

### Revision 129.0

-   Removed per-paint `CalcTextHeight()` calls from the row-height
    calculation.
-   Restored the original compact row height exactly at the default
    Track scale of `0.90`.
-   Above `0.90`, row height now expands from the actual Track font-size
    increase, with a maximum five-pixel adjustment.
-   Reducing the Track scale correspondingly reduces the adaptive
    row-height adjustment.
-   Subtitle size remains tied to one-half of the Track scale and does
    not independently affect row height.
-   This change is intended to prevent `g`, `p`, `q` and `y` descenders
    from clipping at the largest usable Track scale without making
    normal rows unnecessarily tall.

### Revision 128.0

-   Restored the original row height as the normal visual baseline.
-   Subtitle font metrics no longer increase row height.
-   Track font metrics can add at most 2 pixels when required to prevent
    descender clipping.

### Revision 127.0

-   Removed the automatically generated `[` and `]` characters from the
    Subtitle line.
-   Subtitle text continues to use the normal formatted-text renderer,
    so `$rgb()` and other supported title-format colour controls remain
    available.

### Revision 126.0

-   Subtitle outer brackets are now rendered separately from the
    formatted subtitle content. This prevents the opening `[` from being
    lost when a `$rgb()` or related TF colour control appears at the
    beginning of the subtitle result.
-   Row height again starts from the original compact row-height
    calculation.
-   Adaptive row-height expansion now uses only the measured font-height
    deficit, with no extra padding and a maximum four-pixel expansion.

### Revision 125.0

-   Subtitle sizing is tied directly to the Track/title font scale
    again.
-   Ctrl + mouse wheel over either Track or Subtitle changes the shared
    Track scale by `0.1`.
-   The Subtitle is rendered internally at **one-half of the Track
    scale**.
-   The independent Subtitle font-scale Property from v123 has been
    removed.

### Revision 123.0

-   Restored an independent `TEXT | Subtitle font scale` Property with a
    default of `0.45`.
-   Subtitle Ctrl + mouse wheel resizing now changes only the Subtitle
    scale.
-   Subtitle text now uses the same formatted-text renderer as Artist,
    Album and Track, including `$rgb()` and related TF colour
    formatting.
-   Row height now uses SMP `CalcTextHeight()` metrics and expands when
    the selected fonts require additional vertical space, helping
    prevent descenders such as `g`, `p`, `q` and `y` from being clipped
    when the Track font is enlarged.
-   GDI font objects are cached and reused instead of being recreated
    for every scale change.
-   Font-scale Property persistence is debounced during rapid Ctrl +
    mouse-wheel use.

### Revision 122.0

-   Reduced the internal Subtitle scale ratio from 2/3 to 1/2 of the
    Track scale.
-   At the default Track scale of 0.90, the effective Subtitle scale is
    now 0.45.
-   Artist and Album now use the existing formatted-text renderer, so TF
    color functions such as `$rgb()` and `$transition()` are handled in
    both header fields.
-   Current-track text now reuses the normal Track GDI font instead of
    creating a duplicate font object, reducing font creation work during
    resizing.

### Revision 121.0

Artist and Album share the `TEXT | Artist font scale` value.

Track and Subtitle share the `TEXT | Track font scale` value. The
Subtitle font is rendered internally at **one-half of the Track scale**,
so a Track scale of `0.90` produces an effective Subtitle scale of
`0.45`.

Ctrl + mouse wheel over either member of a pair changes the shared scale
by `0.1`.

### Revision 120.0

-   Font objects are rebuilt only when needed instead of on every paint.
-   Ctrl + mouse-wheel font changes still rebuild fonts immediately.
-   Panel resizing rebuilds fonts as needed.
-   Panel Properties is opened after the custom popup menu closes to
    avoid intermittent dialog-opening failures.

### Revision 119.0

-   Album font scaling is now tied directly to Artist font scaling.
-   Subtitle font scaling is now tied directly to Track font scaling.
-   Removed the obsolete independent Album and Subtitle font-scale
    Properties.
-   Ctrl + mouse wheel over either text member changes its shared scale
    by 0.1.

### Revision 118.0

-   Corrected Ctrl + mouse-wheel hit testing for the header Artist and
    Album text. Both now use the actual horizontal header geometry and
    measured Artist width.
-   Corrected subtitle hit testing to use the subtitle state captured
    for each displayed track row.
-   Ctrl + mouse-wheel is now fully consumed even when the selected font
    scale is already at its 0.5 or 2.0 limit, so it cannot accidentally
    scroll the track list.
-   Preserved row geometry during font-scale changes so repeated Ctrl +
    wheel adjustments continue to target the same text area immediately.
-   Updated the current frequency-bar timer fallback/default
    documentation to 40 ms.
-   Version is 118.0.

### Revision 117.0

-   Simplified the built-in Help text for Ctrl + mouse-wheel font
    scaling.
-   Removed the problematic `area's` wording entirely.
-   No functional changes to font scaling, mouse-wheel scrolling, or EQ
    animation.
-   Version is 117.0.

### Revision 116.0

-   Corrected Ctrl + mouse-wheel hit testing for all four TEXT areas.
-   Artist and Album now use the actual header region rather than
    undefined header-geometry properties.
-   Subtitle detection now uses the same subtitle/title height
    relationship as the track-row renderer instead of relying on a
    nonexistent `row.subtitle` field.
-   Font scaling now passes the runtime `P.*Scale` key directly to the
    generic scaling function, which updates both the runtime value and
    the SMP Property.
-   Normal mouse-wheel track-list scrolling remains unchanged.
-   Version is 116.0.

### Revision 115.0

-   Restored the original mouse-wheel track-list scrolling when Ctrl is
    not held.
-   Ctrl + mouse-wheel remains reserved for font scaling when the
    pointer is over one of the four TEXT areas.
-   Font scaling now updates both the persistent SMP Property and the
    corresponding runtime `P.*Scale` value before rebuilding fonts, so
    the visible text updates immediately.
-   Versioned filenames are no longer used for the primary script; the
    source is `SMP_Album_Visualizer.js`.

### Revision 114.0

-   Renamed the primary script file to `SMP_Album_Visualizer.js`;
    version numbers remain in `window.DefineScript`.
-   Changed the default `frequencyBarInterval` to 40 ms, based on
    testing showing 40 ms produces no adverse effects.
-   Added Ctrl + mouse-wheel font scaling for the four TEXT areas:
    artist, album, subtitle, and track.
-   Each adjustment changes the corresponding TEXT scale by 0.1.
-   Font scale is clamped to 0.5--2.0.
-   Ordinary mouse-wheel behavior is unchanged when Ctrl is not held.
-   Updated built-in Help documentation.

### Revision 113.0

-   Replaced the frequency animation's full-panel `window.Repaint()`
    with `window.RepaintRect()` for the small EQ-bar rectangle.
-   Pause/stop cleanup also repaints only the EQ-bar rectangle when it
    is available, with a full repaint retained as a safe fallback.
-   Added a helper that locates the current visible EQ-bar rectangle
    from the most recent row layout without scanning the entire album on
    every timer tick.
-   Updated built-in Help to document the localized repaint behavior.

### Revision 112.0

-   Added occasional transient peaks to the upper frequency bands to
    suggest cymbal/crash events.
-   Decoupled simulation update frequency from full-panel repaint
    frequency.
-   Very small `frequencyBarInterval` values can update the animation
    more rapidly while repainting remains throttled.
-   Updated Help to document the transient treble behavior and repaint
    throttling.

### Revision 111.0

-   Frequency-bar height is now independent of whether the subtitle/tag
    line is enabled.
-   Enabling `TRACK | Show subtitle/tag line` no longer reduces the
    frequency-bar height.

### Revision 110.0

-   Corrected JavaScript escaping in the built-in `const HELP` strings.
-   No functional/user-interface behavior changed.

### Revision 109.0

-   Built-in `const HELP` updated to reflect the current-state
    documentation.
-   `Help / Documentation` uses the internal Spider Monkey Panel popup
    and requires no external application.
-   Help content now documents the current artwork, subtitle, animation,
    context-menu, and playback-interaction behavior.

### Revision 108.0

-   Artwork left-click uses `centerCurrentTrack()`.
-   Built-in Help documents artwork click behavior.
-   Help / Documentation moved to the top of the custom right-click
    menu.
-   Help / Documentation is followed immediately by a separator.
-   Current external documentation/resource links retained.
-   PlayControl-style panel commands retained.

### Revision 107.0

-   Separated frequency-bar state updates from drawing.
-   Mouse movement/repaint can no longer animate frequency bars while
    playback is paused.
-   Frequency animation is gated by active playback.

### Revision 104.0

-   Replaced the Boolean subtitle-source Property with configurable
    `TRACK | Subtitle title format`.
-   Added support for arbitrary foobar2000 title-format expressions in
    the subtitle line.
-   Updated built-in Help accordingly.

### Revision 103.0

-   Frequency-bar timer default changed to **240 ms**.
-   Artwork corner-radius ratio default changed to **0.04**.

------------------------------------------------------------------------

**End of current-state reference.**
