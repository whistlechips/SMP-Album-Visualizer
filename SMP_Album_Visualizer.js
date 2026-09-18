/*
    SMP Album Visualizer - Spider Monkey Panel
    Version 2.0

    Target:
      foobar2000 1.6.x 32-bit
      foo_spider_monkey_panel

    Layout:
      - Uses the COMPLETE current panel/window dimensions.
      - Responsive typography and artwork sizing.
      - Album artwork occupies the available right-side artwork area.
      - Track list occupies the left side.
      - No "videos" badge.
      - Visual styling follows the supplied SMP Album Visualizer reference.

    Interaction:
      - Mouse wheel: scroll album tracks.
      - Double-click a track: play it.
      - Right-click: reload / properties / edit script.

    Notes:
      - Album membership is obtained from the Media Library first.
      - If the Media Library is unavailable/empty, the active playlist is used.
      - Album Artist + Album are preferred for matching.
      - A conservative Album-only fallback is used when necessary.
      - The currently playing handle is always retained in the album track list.
*/

'use strict';

window.DefineScript('SMP Album Visualizer', {
    author: 'SMP Album Visualizer Project',
    version: '155.0',
    features: {
        grab_focus: true
    }
});

// -----------------------------------------------------------------------------
// Constants
// -----------------------------------------------------------------------------

const DT_LEFT         = 0x00000000;
const DT_CENTER       = 0x00000001;
const DT_RIGHT        = 0x00000002;
const DT_VCENTER      = 0x00000004;
const DT_SINGLELINE   = 0x00000020;
const DT_NOPREFIX     = 0x00000800;
const DT_END_ELLIPSIS = 0x00008000;

const IDC_ARROW = 32512;
const IDC_HAND  = 32649;

// Win32 popup-menu flags used by CreatePopupMenu().  SMP v1.6.1 does not
// define these as JavaScript globals.
const MF_STRING    = 0x0000;
const MF_SEPARATOR = 0x0800;

// -----------------------------------------------------------------------------
// Color / utility helpers
// -----------------------------------------------------------------------------

function RGBA(r, g, b, a) {
    return (((a & 255) << 24) |
        ((r & 255) << 16) |
        ((g & 255) << 8) |
        (b & 255)) >>> 0;
}

function clamp(v, lo, hi) {
    return Math.max(lo, Math.min(hi, v));
}

function sameHandle(a, b) {
    if (!a || !b) return false;

    try {
        if (
            a.Path !== undefined &&
            b.Path !== undefined &&
            a.SubSong !== undefined &&
            b.SubSong !== undefined
        ) {
            return a.Path === b.Path &&
                a.SubSong === b.SubSong;
        }
    } catch (e) {
        // Fall through to Compare().
    }

    try {
        const result = a.Compare(b);
        return result === 0 || result === true;
    } catch (e2) {
        return false;
    }
}

function escapeQueryValue(s) {
    return String(s || '').replace(/"/g, '""');
}

function evalTF(tf, handle, fallback) {
    if (!handle) return fallback || '';

    try {
        const v = tf.EvalWithMetadb(handle);

        if (v === undefined || v === null || v === '') {
            return fallback || '';
        }

        return String(v);
    } catch (e) {
        return fallback || '';
    }
}

function textWidth(gr, text, font) {
    try {
        return gr.CalcTextWidth(text, font);
    } catch (e) {
        return 0;
    }
}



function drawText(gr, text, font, colour, x, y, w, h, flags) {
    if (!text || w <= 0 || h <= 0) return;

    gr.GdiDrawText(
        text,
        font,
        colour,
        Math.round(x),
        Math.round(y),
        Math.round(w),
        Math.round(h),
        flags
    );
}

function drawFormattedTrackTitle(
    gr,
    text,
    font,
    defaultColour,
    x,
    y,
    w,
    h,
    flags
) {
    if (!text || w <= 0 || h <= 0) return;

    // Important: '[' and ']' are title-format syntax characters.
    // If the evaluated TF expression returns a literal '[' character,
    // it remains in the drawable text below. Brackets used by foobar2000
    // as optional-section syntax are resolved before this renderer sees
    // the resulting string.

    // foobar2000 title formatting represents $rgb() / $transition() colours
    // as ETX-delimited colour control sequences. GDI does not interpret those
    // sequences itself, so parse them and draw the affected text runs using
    // the corresponding colours.
    const ETX = String.fromCharCode(3);
    const segments = [];
    let colour = defaultColour;
    let pos = 0;

    while (pos < text.length) {
        const start = text.indexOf(ETX, pos);

        if (start < 0) {
            if (pos < text.length) {
                segments.push({
                    text: text.substring(pos),
                    colour: colour
                });
            }
            break;
        }

        if (start > pos) {
            segments.push({
                text: text.substring(pos, start),
                colour: colour
            });
        }

        const end = text.indexOf(ETX, start + 1);

        if (end < 0) {
            // Malformed/incomplete colour sequence. Treat the remaining
            // control character as non-display data.
            break;
        }

        const code = text.substring(start + 1, end);

        if (!code) {
            colour = defaultColour;
        } else {
            const normal = code.substring(0, 6);
            const match = /^([0-9A-Fa-f]{6})(?:\|[0-9A-Fa-f]{6})?$/.exec(
                code
            );

            if (match) {
                // foobar2000 colour codes are BGR hexadecimal.
                const b = parseInt(normal.substring(0, 2), 16);
                const g = parseInt(normal.substring(2, 4), 16);
                const r = parseInt(normal.substring(4, 6), 16);

                colour = RGBA(r, g, b, 255);
            }
        }

        pos = end + 1;
    }

    if (!segments.length) return;

    // If no colour control sequences were present, retain native
    // DT_END_ELLIPSIS behaviour exactly as before.
    if (text.indexOf(ETX) < 0) {
        drawText(
            gr,
            text,
            font,
            defaultColour,
            x,
            y,
            w,
            h,
            flags
        );
        return;
    }

    // Flatten the formatted string into drawable characters. This allows
    // ellipsis to be applied without displaying the internal colour codes.
    const chars = [];

    for (let i = 0; i < segments.length; i++) {
        const part = segments[i].text;
        const charsInPart = Array.from(part);

        for (let j = 0; j < charsInPart.length; j++) {
            chars.push({
                ch: charsInPart[j],
                colour: segments[i].colour
            });
        }
    }

    const ellipsis = '\u2026';

    function widthOf(items, addEllipsis) {
        let value = '';

        for (let i = 0; i < items.length; i++) {
            value += items[i].ch;
        }

        if (addEllipsis) value += ellipsis;

        return textWidth(
            gr,
            value,
            font
        );
    }

    let visible = chars;

    if (widthOf(chars, false) > w) {
        let lo = 0;
        let hi = chars.length;

        while (lo < hi) {
            const mid = Math.ceil((lo + hi) / 2);
            if (widthOf(chars.slice(0, mid), true) <= w) {
                lo = mid;
            } else {
                hi = mid - 1;
            }
        }

        visible = chars.slice(0, lo);

        if (visible.length) {
            visible.push({
                ch: ellipsis,
                colour: visible[visible.length - 1].colour
            });
        } else {
            visible = [{
                ch: ellipsis,
                colour: defaultColour
            }];
        }
    }

    // Draw contiguous runs that share the same colour.
    let runStart = 0;
    let cursorX = Math.round(x);

    while (runStart < visible.length) {
        const runColour = visible[runStart].colour;
        let runEnd = runStart + 1;

        while (
            runEnd < visible.length &&
            visible[runEnd].colour === runColour
        ) {
            runEnd++;
        }

        let runText = '';

        for (let i = runStart; i < runEnd; i++) {
            runText += visible[i].ch;
        }

        const runW = textWidth(
            gr,
            runText,
            font
        );

        if (runW > 0) {
            gr.GdiDrawText(
                runText,
                font,
                runColour,
                cursorX,
                Math.round(y),
                Math.max(1, Math.round(x + w - cursorX)),
                Math.round(h),
                flags & ~DT_END_ELLIPSIS
            );

            cursorX += Math.round(runW);
        }

        runStart = runEnd;
    }
}

// -----------------------------------------------------------------------------
// Persistent properties
// -----------------------------------------------------------------------------

// The SMP Properties dialog permits a user to leave an editable Property
// blank.  For nearly all user-facing settings in this script, blank is not a
// meaningful value and can propagate into numeric, boolean, color, font, or
// title-format calculations.  Normalize those values immediately back to the
// property's documented default.  The No cover image path is the deliberate
// exception because an empty path means 'no external fallback image'.
function getSafeProperty(name, fallback, allowBlank) {
    const raw = window.GetProperty(name, fallback);

    if (allowBlank) {
        return raw;
    }

    const text = String(raw == null ? '' : raw).trim();

    if (text === '') {
        debugLog('Property BLANK: ' + name + ' -> default=' + fallback);
        window.SetProperty(name, fallback);
        return fallback;
    }

    return raw;
}

// Numeric Properties are stored as strings for the same reason as font-scale
// Properties: the SMP Properties dialog can behave badly when a numeric
// Property is cleared to blank.  Keep the persisted representation text-based
// and convert it to a number for all internal calculations.
function normalizeNumericProperty(name, fallback) {
    const raw = window.GetProperty(name, String(fallback));
    const text = String(raw == null ? '' : raw).trim();

    if (text === '') {
        debugLog('Numeric property BLANK: ' + name + ' -> default=' + fallback);
        window.SetProperty(name, String(fallback));
        return fallback;
    }

    const value = Number(text);

    if (!isFinite(value)) {
        debugLog('Numeric property INVALID: ' + name + ' raw=\"' + text + '\" -> default=' + fallback);
        window.SetProperty(name, String(fallback));
        return fallback;
    }

    // Migrate older numeric-backed Properties to strings so the Properties
    // editor cannot enter the problematic numeric/blank state.
    if (typeof raw !== 'string') {
        debugLog('Numeric property MIGRATE: ' + name + ' raw=' + raw + ' -> string=\"' + text + '\"');
        window.SetProperty(name, text);
    }

    return value;
}

function parseRGBAProperty(value, fallback) {
    if (value === undefined || value === null) return fallback;

    const text = String(value).trim();
    const parts = text.split(/[\s,;-]+/).filter(Boolean);

    if (parts.length === 4) {
        const r = Number(parts[0]);
        const g = Number(parts[1]);
        const b = Number(parts[2]);
        const a = Number(parts[3]);

        if (
            Number.isFinite(r) &&
            Number.isFinite(g) &&
            Number.isFinite(b) &&
            Number.isFinite(a)
        ) {
            return RGBA(
                clamp(Math.round(r), 0, 255),
                clamp(Math.round(g), 0, 255),
                clamp(Math.round(b), 0, 255),
                clamp(Math.round(a), 0, 255)
            );
        }
    }

    // Backward compatibility with packed numeric properties saved by older
    // versions.
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value >>> 0;
    }

    return fallback;
}

// Pseudo-category headers: UI-only Properties used to visually organize
// the standard SMP Properties dialog. They are intentionally not accessed
// elsewhere in the script.
// Remove legacy, un-categorized Property slots left by pre-v91 versions.
// These names are no longer used by the script.
const legacyProperties = [
    'Album title format',
    'Track title format',
    'Current track background color',
    'Hover background color'
];

for (let i = 0; i < legacyProperties.length; i++) {
    window.SetProperty(
        legacyProperties[i],
        undefined
    );
}

const P = {
    frequencyBarInterval: normalizeNumericProperty(
        'ANIMATION | EQ / frequency bar timer interval (ms)',
        40
    ),

    showFrequencyBars: getSafeProperty(
        'ANIMATION | Show animated frequency bars',
        true
    ),

    artworkWidthRatio: normalizeNumericProperty(
        'ARTWORK | Artwork area width ratio',
        0.46
    ),

    artworkBorder: getSafeProperty(
        'ARTWORK | Artwork border',
        '255,255,255,25'
    ),

    artworkRadiusRatio: normalizeNumericProperty(
        'ARTWORK | Artwork corner radius ratio',
        0.04
    ),

    artworkTopRatio: normalizeNumericProperty(
        'ARTWORK | Artwork top ratio',
        0.12
    ),

    noCoverImagePath: getSafeProperty(
        'ARTWORK | No cover image path',
        '',
        true
    ),

    noCoverText: getSafeProperty(
        'ARTWORK | No cover text',
        'NO COVER'
    ),

    bgGlow: getSafeProperty(
        'BACKGROUND | Background - purple tint',
        '36,31,54,42'
    ),

    bgBlurRadius: normalizeNumericProperty(
        'BACKGROUND | Background blur radius',
        48
    ),

    bgOverlay: getSafeProperty(
        'BACKGROUND | Background dark overlay',
        '0,0,0,125'
    ),

    animateBackgroundOverlay: getSafeProperty(
        'BACKGROUND | Animate dark overlay',
        false
    ),

    albumText: getSafeProperty(
        'COLORS | Album text',
        '211,209,216,255'
    ),

    artistText: getSafeProperty(
        'COLORS | Artist text',
        '248,248,249,255'
    ),

    fontText: getSafeProperty(
        'COLORS | Font text',
        '215,214,220,255'
    ),

    mutedText: getSafeProperty(
        'COLORS | Muted text',
        '130,128,137,255'
    ),

    subtitleText: getSafeProperty(
        'COLORS | Subtitle text',
        '185,182,191,255'
    ),

    trackText: getSafeProperty(
        'COLORS | Track text',
        '215,214,220,255'
    ),

    currentTrackBackgroundColor: getSafeProperty(
        'COLORS | Current track background color',
        '255,255,255,70'
    ),

    hoverBackgroundColor: getSafeProperty(
        'COLORS | Hover background color',
        '255,255,255,70'
    ),

    artistFontName: getSafeProperty(
        'FONTS | Artist font',
        'Roboto Condensed Bold'
    ),

    artistWeight: normalizeNumericProperty(
        'FONTS | Artist font style',
        1
    ),

    fontName: getSafeProperty(
        'FONTS | Font',
        'Roboto Condensed Light'
    ),

    albumTitleFormat: getSafeProperty(
        'FORMATS | Album title format',
        '%album%'
    ),

    trackTitleFormat: getSafeProperty(
        'FORMATS | Track title format',
        '$if($stricmp(%album artist%,Various Artists),%title%$rgb(130,128,137)\u200A\u2022\u200A%artist%$rgb()$ifequal([%lfm_loved%],1,  \u2665,$ifequal([%smp_loved%],1,  \u2665,)),%title%$ifequal([%lfm_loved%],1,  \u2665,$ifequal([%smp_loved%],1,  \u2665,)))'
    ),

    headerHeight: normalizeNumericProperty(
        'LAYOUT | Header height ratio',
        0.105
    ),

    headerLeftMargin: normalizeNumericProperty(
        'LAYOUT | Header left margin',
        0.115
    ),

    outerMargin: normalizeNumericProperty(
        'LAYOUT | Outer margin',
        0.040
    ),

    trackGapRatio: normalizeNumericProperty(
        'LAYOUT | Track gap ratio',
        0.014
    ),

    trackListLeftMargin: normalizeNumericProperty(
        'LAYOUT | Track list left margin',
        0.050
    ),

    trackNumberWidthRatio: normalizeNumericProperty(
        'LAYOUT | Track number width ratio',
        0.040
    ),

    centerCurrentTrack: getSafeProperty(
        'NAVIGATION | Center current track automatically',
        true
    ),

    wheelRows: normalizeNumericProperty(
        'NAVIGATION | Mouse wheel rows',
        3
    ),

    albumTitleGap: normalizeNumericProperty(
        'TEXT | Artist / Album title gap',
        24
    ),

    artistScale: getSafeProperty(
        'TEXT | Artist font scale',
        '1.14'
    ),

    trackScale: getSafeProperty(
        'TEXT | Track font scale',
        '0.90'
    ),

    showSubtitles: getSafeProperty(
        'TRACK | Show subtitle/tag line',
        true
    ),

    showTrackCountBadge: getSafeProperty(
        'TRACK | Show track count badge',
        true
    ),

    subtitleFormat: getSafeProperty(
        'TRACK | Subtitle title format',
        '%subtitle%'
    )
};

// Font-scale Properties are deliberately stored as strings.  SMP's Properties
// dialog can otherwise retain an integer-valued property after a wheel change
// lands exactly on 1, causing decimal edits such as 0.9 to be coerced back to
// the integer value.  Keep the persisted representation text-based while all
// internal calculations continue to use numbers.
function normalizeFontScaleProperty(name, fallback) {
    const raw = window.GetProperty(name, fallback);
    const text = String(raw == null ? '' : raw).trim();
    const value = Number(text);

    if (text === '' || !isFinite(value)) {
        debugLog('Font scale property INVALID: ' + name + ' raw="' + text + '" fallback=' + fallback);
        window.SetProperty(name, String(fallback));
        return fallback;
    }

    // Migrate older numeric-backed Properties to the string-backed form.
    // This is what prevents an existing integer value such as 1 from making
    // the Properties editor treat subsequent decimal input as invalid.
    if (typeof raw !== 'string') {
        debugLog('Font scale property MIGRATE: ' + name + ' raw=' + raw + ' -> string="' + text + '"');
        window.SetProperty(name, text);
    }

    return value;
}

P.artistScale = normalizeFontScaleProperty(
    'TEXT | Artist font scale',
    1.14
);
P.trackScale = normalizeFontScaleProperty(
    'TEXT | Track font scale',
    0.90
);

// User-facing color properties are stored/read as RGBA strings.
// Convert them to packed colors for GDI drawing.

P.bgGlow = parseRGBAProperty(P.bgGlow, RGBA(36,31,54,42));
P.bgOverlay = parseRGBAProperty(P.bgOverlay, RGBA(0,0,0,125));
P.trackText = parseRGBAProperty(P.trackText, RGBA(215,214,220,255));
P.subtitleText = parseRGBAProperty(P.subtitleText, RGBA(185,182,191,255));
P.mutedText = parseRGBAProperty(P.mutedText, RGBA(130,128,137,255));
P.artistText = parseRGBAProperty(P.artistText, RGBA(248,248,249,255));
P.fontText = parseRGBAProperty(P.fontText, RGBA(215,214,220,255));
P.albumText = parseRGBAProperty(P.albumText, RGBA(211,209,216,255));
P.artworkBorder = parseRGBAProperty(
    P.artworkBorder,
    RGBA(255,255,255,25)
);

// -----------------------------------------------------------------------------
// Title formatting
// -----------------------------------------------------------------------------

const TF = {
    albumArtist: fb.TitleFormat('%album artist%'),
    artist: fb.TitleFormat('%artist%'),
    album: fb.TitleFormat('%album%'),
    albumTitle: fb.TitleFormat(
P.albumTitleFormat
    ),
    date: fb.TitleFormat('%date%'),
    title: fb.TitleFormat('%title%'),
    track: fb.TitleFormat('%tracknumber%'),
    disc: fb.TitleFormat('%discnumber%'),
    subtitle: fb.TitleFormat(
        P.subtitleFormat
    )
};

// -----------------------------------------------------------------------------
// State
// -----------------------------------------------------------------------------

let nowPlaying = null;
let albumTracks = new FbMetadbHandleList();

let albumArtist = '';
let albumTitle = '';
let albumDate = '';

let artwork = null;
let artworkIsFallback = false;
let noCoverFallback = null;
let noCoverImageCache = null;
let noCoverImageCachePath = '';
let artworkRequestId = 0;

let blurredBackground = null;
let blurredBackgroundW = 0;
let blurredBackgroundH = 0;
let blurredBackgroundSource = null;
let blurredBackgroundRadius = 0;

// Cached rounded artwork used by the paint path. Creating GDI bitmaps on
// every repaint is unnecessary and can put sustained pressure on GDI/GC
// resources when the frequency animation is active.
let roundedArtworkCache = null;
let roundedArtworkSource = null;
let roundedArtworkSize = 0;
let roundedArtworkRadius = 0;

// Artwork is deliberately retained while a new cover is loading. This avoids
// a blank/fallback frame (and therefore the visible panel blinking) whenever
// playback moves to another track.

// Accent color sampled from the album cover.
let artworkAccent = null;

let scrollOffset = 0;
let hoveredTrack = -1;

// Bright leading edge of the current-track indicator blinks while playback
// is active. It stays visible when paused/stopped.
let trackIndicatorBlink = true;
let trackIndicatorTimer = null;

// Animated EQ-style bars shown on the currently playing track.
let frequencyTimer = null;

// Optional, deliberately slow background "breathing" effect. The user's
// Background dark overlay Property remains unchanged; only the alpha used
// for drawing is varied temporarily while playback is active.
const backgroundOverlayAnimationRange = 40;
const backgroundOverlayAnimationCycleMs = 30000;
const backgroundOverlayAnimationIntervalMs = 200;
let backgroundOverlayTimer = null;
let backgroundOverlayPhase = 0;

let popupMenuActive = false;
let frequencyPhase = 0;

let rowRects = [];
let fontScaleHeaderRects = null;
let fontsDirty = false;

let fonts = {
    artist: null,
    album: null,
    track: null,
    subtitle: null,
};

let albumTitleTF = null;
let trackTitleTF = null;

function rebuildTitleFormat() {
    const albumFormat = P.albumTitleFormat || '%album%';
    const trackFormat = P.trackTitleFormat || '%title%';

    try {
        albumTitleTF = fb.TitleFormat(albumFormat);
    } catch (e) {
        albumTitleTF = fb.TitleFormat('%album%');
    }

    try {
        trackTitleTF = fb.TitleFormat(trackFormat);
    } catch (e2) {
        trackTitleTF = fb.TitleFormat('%title%');
    }
}

// -----------------------------------------------------------------------------
// Responsive typography
// -----------------------------------------------------------------------------

// All persistent/repeated font creation goes through this cache.
// In particular, never create GDI fonts directly from the paint path.
const fontCache = Object.create(null);

function createFont(size, style, fontName) {
    // Prefer the requested font. Fall back gracefully if it is not installed.
    const name = fontName || P.fontName;
    const key =
        name + '|' +
        Math.round(size * 10) / 10 + '|' +
        style;

    if (fontCache[key]) {
        return fontCache[key];
    }

    const font =
        gdi.Font(name, size, style) ||
        gdi.Font('Roboto Condensed', size, style) ||
        gdi.Font('Arial Narrow', size, style) ||
        gdi.Font('Segoe UI', size, style);

    if (font) {
        fontCache[key] = font;
    }

    return font;
}

function rebuildFonts() {
    const h = Math.max(1, window.Height);

    const scale = clamp(h / 250, 0.70, 2.80);

    const artistSize = clamp(
        17.5 * scale * P.artistScale,
        11,
        52
    );

    const albumSize = clamp(
        13.0 * scale * P.artistScale,
        9,
        36
    );

    const trackSize = clamp(
        11.0 * scale * P.trackScale,
        8,
        30
    );

    const subtitleScale = P.trackScale * 0.5;

    const subtitleSize = clamp(
        11.0 * scale * subtitleScale,
        6,
        24
    );

    // Artist font is independently configurable from the normal panel font.
    // This permits, for example, Roboto Condensed Black/Bold for the artist
    // while the track list continues using the regular Font property.
    fonts.artist = createFont(
        artistSize,
        P.artistWeight,
        P.artistFontName
    );

    fonts.album = createFont(
        albumSize,
        0
    );

    fonts.track = createFont(
        trackSize,
        0
    );

    fonts.currentTrack = createFont(
        trackSize,
        0
    );

    fonts.subtitle = createFont(
        subtitleSize,
        0
    );

    fontsDirty = false;
}

// -----------------------------------------------------------------------------
// Album source / lookup
// -----------------------------------------------------------------------------

function getSourceHandles() {
    // Media Library is the preferred source.
    try {
        if (fb.IsLibraryEnabled()) {
            const library = fb.GetLibraryItems();

            if (library && library.Count > 0) {
                return library;
            }
        }
    } catch (e) {
        // Continue to playlist fallback.
    }

    // Active playlist fallback.
    try {
        const ap = plman.ActivePlaylist;

        if (ap >= 0) {
            const playlist = plman.GetPlaylistItems(ap);

            if (playlist && playlist.Count > 0) {
                return playlist;
            }
        }
    } catch (e2) {
        // Continue.
    }

    return new FbMetadbHandleList();
}

function sortAlbumTracks(handles) {
    if (!handles || handles.Count < 2) return handles;

    try {
        handles.OrderByFormat(
            fb.TitleFormat(
                '$num(%discnumber%,3)|$num(%tracknumber%,4)|%title%'
            ),
            1
        );
    } catch (e) {
        // Keep source order if sorting isn't available.
    }

    return handles;
}

function ensureCurrentTrackInAlbum(handles, handle) {
    if (!handle) return handles;

    const result = handles || new FbMetadbHandleList();

    for (let i = 0; i < result.Count; i++) {
        if (sameHandle(result[i], handle)) {
            return result;
        }
    }

    // Album discovery is allowed to use metadata fallbacks, but the track
    // that is actually playing must never disappear simply because its
    // metadata does not match the query used to build the album list.
    result.Add(handle);

    return result;
}

function queryAlbum(source, handle) {
    const album = evalTF(TF.album, handle, '');

    if (!album) {
        return new FbMetadbHandleList(handle);
    }

    const albumArtistValue = evalTF(
        TF.albumArtist,
        handle,
        ''
    );

    const artistValue = evalTF(
        TF.artist,
        handle,
        ''
    );

    const albumQ = escapeQueryValue(album);
    let result = null;

    // First attempt: Album Artist + Album.
    if (albumArtistValue) {
        try {
            const q = 'album artist IS "' +
                escapeQueryValue(albumArtistValue) +
                '" AND album IS "' +
                albumQ +
                '"';

            result = fb.GetQueryItems(source, q);

            if (result && result.Count > 0) {
                result = ensureCurrentTrackInAlbum(result, handle);
                return sortAlbumTracks(result);
            }
        } catch (e) {
            // Continue to Artist + Album.
        }
    }

    // Second attempt: Artist + Album. This is the normal fallback when
    // Album Artist is missing.
    if (artistValue) {
        try {
            const q = 'artist IS "' +
                escapeQueryValue(artistValue) +
                '" AND album IS "' +
                albumQ +
                '"';

            result = fb.GetQueryItems(source, q);

            if (result && result.Count > 0) {
                result = ensureCurrentTrackInAlbum(result, handle);
                return sortAlbumTracks(result);
            }
        } catch (e2) {
            // Continue to Album-only.
        }
    }

    // Third attempt: Album only.
    try {
        result = fb.GetQueryItems(
            source,
            'album IS "' + albumQ + '"'
        );

        if (result && result.Count > 0) {
            result = ensureCurrentTrackInAlbum(result, handle);
            return sortAlbumTracks(result);
        }
    } catch (e3) {
        // Continue to final fallback.
    }

    return new FbMetadbHandleList(handle);
}

function centerCurrentTrack() {
    if (
        !P.centerCurrentTrack ||
        !nowPlaying ||
        !albumTracks ||
        albumTracks.Count === 0
    ) {
        return;
    }

    const L = getLayout();

    if (L.visibleRows <= 0) return;

    let currentIndex = -1;

    for (let i = 0; i < albumTracks.Count; i++) {
        if (sameHandle(albumTracks[i], nowPlaying)) {
            currentIndex = i;
            break;
        }
    }

    if (currentIndex < 0) return;

    // Center the current track in the visible portion of the list.
    const targetOffset =
        currentIndex -
        Math.floor((L.visibleRows - 1) / 2);

    const maxOffset = Math.max(
        0,
        albumTracks.Count - L.visibleRows
    );

    scrollOffset = clamp(
        targetOffset,
        0,
        maxOffset
    );
}

function createNoCoverFallback() {
    const size = 512;
    const img = gdi.CreateImage(size, size);
    const gr = img.GetGraphics();

    gr.FillSolidRect(
        0,
        0,
        size,
        size,
        RGBA(38, 38, 42, 255)
    );

    gr.DrawRect(
        1,
        1,
        size - 3,
        size - 3,
        2,
        RGBA(255, 255, 255, 28)
    );

    const iconFont = createFont(
        82,
        0,
        'Segoe Fluent Icons'
    );

    if (iconFont) {
        gr.GdiDrawText(
            '\uE93C',
            iconFont,
            RGBA(255, 255, 255, 85),
            0,
            108,
            size,
            105,
            DT_CENTER |
            DT_VCENTER |
            DT_SINGLELINE |
            DT_NOPREFIX
        );
    }

    const textFont = createFont(
        34,
        1,
        P.artistFontName
    );

    gr.GdiDrawText(
        P.noCoverText || 'NO COVER',
        textFont,
        RGBA(255, 255, 255, 220),
        18,
        235,
        size - 36,
        70,
        DT_CENTER |
        DT_VCENTER |
        DT_SINGLELINE |
        DT_END_ELLIPSIS |
        DT_NOPREFIX
    );

    img.ReleaseGraphics(gr);
    return img;
}

function getNoCoverImage() {
    const path = (P.noCoverImagePath || '').trim();

    if (path) {
        // Cache a user-supplied no-cover image by path.  Without this cache,
        // moving through multiple tracks with missing artwork would reload
        // the same GDI bitmap repeatedly.
        if (
            noCoverImageCache &&
            noCoverImageCachePath === path
        ) {
            return noCoverImageCache;
        }

        try {
            const img = gdi.Image(path);

            if (img && img.Width > 0 && img.Height > 0) {
                noCoverImageCache = img;
                noCoverImageCachePath = path;
                return noCoverImageCache;
            }
        } catch (e) {}
    }

    return noCoverFallback || (
        noCoverFallback = createNoCoverFallback()
    );
}

function updateAlbum(handle) {
    nowPlaying = handle || null;

    scrollOffset = 0;
    hoveredTrack = -1;

    if (!handle) {
        // Do not clear the current album immediately. This prevents the
        // transient "Nothing is playing" frame that can occur between tracks.
        // The existing content remains visible until a new track is ready.
        window.Repaint();
        return;
    }

    albumArtist = evalTF(
        TF.artist,
        handle,
        'Unknown Artist'
    );

    albumTitle = evalTF(
        TF.album,
        handle,
        'Unknown Album'
    );

    albumDate = evalTF(
        TF.date,
        handle,
        ''
    );

    const source = getSourceHandles();

    if (source && source.Count > 0) {
        albumTracks = queryAlbum(source, handle);
    } else {
        albumTracks = new FbMetadbHandleList(handle);
    }

    centerCurrentTrack();

    loadArtwork(handle);

    window.Repaint();
}

// -----------------------------------------------------------------------------
// Album-art accent color
// -----------------------------------------------------------------------------

function parseRGBA(value, fallback) {
    if (value === undefined || value === null) {
        return fallback || null;
    }

    const text = String(value).trim();

    if (!text || text.toLowerCase() === 'auto') {
        return fallback || null;
    }

    // Accept both comma and dash separators.
    const parts = text.split(/[\s,;-]+/).filter(Boolean);

    if (parts.length !== 4) {
        return fallback || null;
    }

    const r = Number(parts[0]);
    const g = Number(parts[1]);
    const b = Number(parts[2]);
    const a = Number(parts[3]);

    if (
        !Number.isFinite(r) ||
        !Number.isFinite(g) ||
        !Number.isFinite(b) ||
        !Number.isFinite(a)
    ) {
        return fallback || null;
    }

    return {
        r: clamp(Math.round(r), 0, 255),
        g: clamp(Math.round(g), 0, 255),
        b: clamp(Math.round(b), 0, 255),
        a: clamp(Math.round(a), 0, 255)
    };
}

function getGradientColour(
    configuredValue,
    alpha,
    paletteIndex
) {
    const configured = parseRGBA(
        configuredValue,
        null
    );

    if (configured) {
        // Preserve the requested RGB but allow the gradient endpoint to
        // control opacity. This guarantees the far end remains transparent.
        return RGBA(
            configured.r,
            configured.g,
            configured.b,
            clamp(
                Math.round(
                    alpha * configured.a / 255
                ),
                0,
                255
            )
        );
    }

    return makeAccentColour(
        alpha,
        paletteIndex
    );
}

function sampleArtworkAccent(img) {
    if (!img) return null;

    try {
        // SMP's colour-scheme API returns dominant colours from the actual
        // bitmap. Keep several candidates so the row gradients can use a
        // palette rather than an arbitrary single/fixed colour.
        const json = img.GetColourSchemeJSON(8);
        const colours = JSON.parse(json);

        if (colours && colours.length) {
            const palette = [];

            for (let i = 0; i < colours.length; i++) {
                const entry = colours[i];
                const c = Number(entry.col);

                const r = c & 255;
                const g = (c >> 8) & 255;
                const b = (c >> 16) & 255;

                const maxc = Math.max(r, g, b);
                const minc = Math.min(r, g, b);
                const saturation = maxc - minc;

                // Reject near-black/near-white colours which make poor
                // transparent row indicators.
                if (maxc < 30 || minc > 235 || saturation < 12) {
                    continue;
                }

                palette.push({
                    r: r,
                    g: g,
                    b: b,
                    freq: Number(entry.freq || 0),
                    sat: saturation
                });
            }

            if (palette.length) {
                // Dominant colour remains the primary choice, but retain the
                // next two meaningful dominant colours for a richer gradient.
                palette.sort(function(a, b) {
                    return (
                        (b.freq * 0.72 + b.sat * 0.28) -
                        (a.freq * 0.72 + a.sat * 0.28)
                    );
                });

                return palette.slice(0, 3);
            }
        }
    } catch (e) {
        // If the colour-scheme API fails, do not invent an album-specific
        // colour. The caller will use a neutral transparent fallback.
    }

    return null;
}

function makeAccentColour(alpha, index) {
    if (!artworkAccent || !artworkAccent.length) {
        return RGBA(255, 255, 255, alpha);
    }

    const p = artworkAccent[
        clamp(index || 0, 0, artworkAccent.length - 1)
    ];

    return RGBA(
        p.r,
        p.g,
        p.b,
        clamp(Math.round(alpha), 0, 255)
    );
}



// -----------------------------------------------------------------------------
// Blurred album-art background
// -----------------------------------------------------------------------------

function invalidateArtworkRenderCache() {
    roundedArtworkCache = null;
    roundedArtworkSource = null;
    roundedArtworkSize = 0;
    roundedArtworkRadius = 0;
}

function getRoundedArtwork(size, radius) {
    if (!artwork || size <= 0) return null;

    if (
        roundedArtworkCache &&
        roundedArtworkSource === artwork &&
        roundedArtworkSize === size &&
        roundedArtworkRadius === radius
    ) {
        return roundedArtworkCache;
    }

    let roundedArtwork = null;
    let artworkMask = null;

    try {
        roundedArtwork = gdi.CreateImage(size, size);
        const artGr = roundedArtwork.GetGraphics();

        if (!drawArtwork(artGr, artwork, 0, 0, size, 255)) {
            throw new Error('Artwork draw failed');
        }

        roundedArtwork.ReleaseGraphics(artGr);

        // SMP ApplyMask uses grayscale mask values to control alpha:
        // black = visible, white = transparent.
        artworkMask = gdi.CreateImage(size, size);
        const maskGr = artworkMask.GetGraphics();

        maskGr.FillSolidRect(
            0,
            0,
            size,
            size,
            0xFFFFFFFF
        );

        maskGr.FillRoundRect(
            0,
            0,
            size,
            size,
            radius,
            radius,
            0xFF000000
        );

        artworkMask.ReleaseGraphics(maskGr);
        roundedArtwork.ApplyMask(artworkMask);

        roundedArtworkCache = roundedArtwork;
        roundedArtworkSource = artwork;
        roundedArtworkSize = size;
        roundedArtworkRadius = radius;

        // The mask is no longer needed after ApplyMask(). Its reference is
        // released here so the GDI bitmap can be reclaimed immediately.
        artworkMask = null;

        return roundedArtworkCache;
    } catch (e) {
        if (artworkMask) artworkMask = null;
        if (roundedArtwork) roundedArtwork = null;
        return null;
    }
}

function invalidateBlurredBackground() {
    blurredBackground = null;
    blurredBackgroundW = 0;
    blurredBackgroundH = 0;
    blurredBackgroundSource = null;
    blurredBackgroundRadius = 0;
}



function rebuildBlurredBackground() {
    if (!artwork || !window.Width || !window.Height) {
        invalidateBlurredBackground();
        return;
    }

    const w = Math.max(1, window.Width);
    const h = Math.max(1, window.Height);

    if (
        blurredBackground &&
        blurredBackgroundW === w &&
        blurredBackgroundH === h &&
        blurredBackgroundSource === artwork &&
        blurredBackgroundRadius === clamp(P.bgBlurRadius, 2, 254)
    ) {
        return;
    }

    try {
        const iw = artwork.Width;
        const ih = artwork.Height;

        if (!iw || !ih) {
            invalidateBlurredBackground();
            return;
        }

        // Create a true "cover" image: preserve the album-art aspect ratio
        // and crop the excess so the art fills the entire panel.
        let srcX = 0;
        let srcY = 0;
        let srcW = iw;
        let srcH = ih;

        const panelRatio = w / h;
        const artRatio = iw / ih;

        if (artRatio > panelRatio) {
            // Art is wider than the panel.
            srcW = ih * panelRatio;
            srcX = (iw - srcW) / 2;
        } else {
            // Art is taller/narrower than the panel.
            srcH = iw / panelRatio;
            srcY = (ih - srcH) / 2;
        }

        // Work at a reduced resolution for the blur. It is then drawn across
        // the complete panel, which is considerably cheaper than repeatedly
        // blurring a full-size bitmap.
        const scale = Math.min(1, 900 / Math.max(w, h));
        const bw = Math.max(1, Math.round(w * scale));
        const bh = Math.max(1, Math.round(h * scale));

        const bg = gdi.CreateImage(bw, bh);
        const bgGr = bg.GetGraphics();

        bgGr.SetInterpolationMode(7);
        bgGr.DrawImage(
            artwork,
            0,
            0,
            bw,
            bh,
            srcX,
            srcY,
            srcW,
            srcH,
            0,
            255
        );

        bg.ReleaseGraphics(bgGr);

        bg.StackBlur(
            clamp(P.bgBlurRadius, 2, 254)
        );

        blurredBackground = bg;
        blurredBackgroundW = w;
        blurredBackgroundH = h;
        blurredBackgroundSource = artwork;
        blurredBackgroundRadius = clamp(P.bgBlurRadius, 2, 254);
    } catch (e) {
        invalidateBlurredBackground();
    }
}

// -----------------------------------------------------------------------------
// Album artwork
// -----------------------------------------------------------------------------

function loadArtwork(handle) {
    if (!handle) return;

    const requestId = ++artworkRequestId;

    try {
        utils.GetAlbumArtAsyncV2(
            window.ID,
            handle,
            0,
            true,
            false,
            false
        ).then(function(result) {
            if (requestId !== artworkRequestId) return;

            const newArtwork = result && result.image
                ? result.image
                : null;

            if (!newArtwork) {
                artwork = getNoCoverImage();
                artworkIsFallback = true;
                artworkAccent = sampleArtworkAccent(artwork);
            } else {
                artwork = newArtwork;
                artworkIsFallback = false;
                artworkAccent = sampleArtworkAccent(artwork);
            }
            invalidateArtworkRenderCache();
            invalidateBlurredBackground();
            rebuildBlurredBackground();
            window.Repaint();
        }).catch(function() {
            // Retain the previous artwork/background on failure.
        });

        return;
    } catch (e) {
        // Older SMP compatibility.
    }

    try {
        const newArtwork = utils.GetAlbumArtV2(
            handle,
            0,
            true
        );

        if (newArtwork) {
            artwork = newArtwork;
            artworkIsFallback = false;
            artworkAccent = sampleArtworkAccent(artwork);
            invalidateArtworkRenderCache();
            invalidateBlurredBackground();
            rebuildBlurredBackground();
            window.Repaint();
        }
    } catch (e2) {
        artwork = getNoCoverImage();
        artworkIsFallback = true;
        artworkAccent = sampleArtworkAccent(artwork);
        invalidateArtworkRenderCache();
        invalidateBlurredBackground();
        rebuildBlurredBackground();
        window.Repaint();
    }
}

function drawArtwork(gr, img, x, y, size, alpha) {
    if (!img || size <= 0) return false;

    const iw = img.Width;
    const ih = img.Height;

    if (!iw || !ih) return false;

    let sx = 0;
    let sy = 0;
    let sw = iw;
    let sh = ih;

    // Center crop to square.
    if (iw > ih) {
        sw = ih;
        sx = (iw - sw) / 2;
    } else if (ih > iw) {
        sh = iw;
        sy = (ih - sh) / 2;
    }

    try {
        gr.SetInterpolationMode(7);

        gr.DrawImage(
            img,
            x,
            y,
            size,
            size,
            sx,
            sy,
            sw,
            sh,
            0,
            alpha
        );

        return true;
    } catch (e) {
        return false;
    }
}

// -----------------------------------------------------------------------------
// Layout
// -----------------------------------------------------------------------------

function getLayout(gr) {
    const w = Math.max(1, window.Width);
    const h = Math.max(1, window.Height);

    const margin = Math.max(
        5,
        Math.round(Math.min(w, h) * P.outerMargin)
    );

    const headerH = Math.max(
        28,
        Math.round(h * P.headerHeight)
    );

    // Artwork rectangle.
    // Size artwork from BOTH dimensions.  It must leave enough room for
    // the track list while still using the available vertical space.
    const availableArtHeight = h - margin * 2;
    const availableArtWidth = Math.round(w * P.artworkWidthRatio);

    // Match the artwork's right edge to the exact same pixel margin used
    // by the track number on the left. This is L.listX's effective margin.
    const trackListLeftMarginPx = Math.max(
        margin,
        Math.round(w * P.trackListLeftMargin)
    );

    const artRight = w - trackListLeftMarginPx;
    const artSize = Math.max(
        60,
        Math.min(
            Math.round(availableArtHeight * 0.82),
            Math.round(availableArtWidth * 0.94),
            artRight - margin
        )
    );

    // Keep the top edge below the Artist / Album header, while allowing the
    // enlarged cover to extend farther down and slightly left.
    const artTop = Math.max(
        headerH + Math.round(h * 0.012),
        Math.round(h * P.artworkTopRatio)
    );

    const artX = artRight - artSize;

    // Artwork uses the same margin on the right and bottom as the
    // panel's current outer margin.
    const artworkEdgeMargin = margin;

    const artY = clamp(
        artTop,
        margin + 5,
        Math.max(
            margin + 5,
            h - artSize - artworkEdgeMargin
        )
    );

    // Left side ends before the artwork.
    const listX = Math.max(
        margin,
        Math.round(w * P.trackListLeftMargin)
    );

    const listRight = artX - Math.max(
        12,
        Math.round(w * 0.010)
    );
    const listW = Math.max(100, listRight - listX);

    const listY = headerH + Math.max(2, Math.round(h * 0.012));
    const listBottom = h - margin;

    const trackGap = Math.max(
        2,
        Math.round(h * P.trackGapRatio)
    );

    // Preserve the original compact row-height calculation at the default
    // Track scale (0.90). Above that point, add only the amount needed to
    // accommodate the larger Track font. This makes row height increase as
    // the Track font grows and decrease again when the font is reduced.
    const baseRowH = clamp(
        Math.round(30 * clamp(h / 250, 0.85, 1.45)),
        26,
        38
    );

    const panelScale = clamp(h / 250, 0.70, 2.80);
    const defaultTrackSize = 11.0 * panelScale * 0.90;
    const trackSize = clamp(
        11.0 * panelScale * P.trackScale,
        8,
        30
    );

    // Use the actual Track font-size delta rather than CalcTextHeight().
    // This avoids per-paint GDI metric calls while allowing one additional
    // additional headroom for descenders at the largest usable scale.
    const extraTextH = Math.min(
        8,
        Math.max(
            0,
            Math.round(trackSize - defaultTrackSize)
        )
    );

    const rowH = baseRowH + extraTextH + trackGap;

    const visibleRows = Math.max(
        1,
        Math.floor(
            (listBottom - listY) / rowH
        )
    );

    return {
        w: w,
        h: h,
        margin: margin,
        headerH: headerH,

        artX: artX,
        artY: artY,
        artSize: artSize,

        listX: listX,
        listY: listY,
        listW: listW,
        listBottom: listBottom,

        trackGap: trackGap,
        rowH: rowH,
        trackFontSize: trackSize,
        visibleRows: visibleRows,

        numberW: Math.max(
            28,
            Math.round(w * P.trackNumberWidthRatio)
        ),

        artRadius: Math.max(
            0,
            Math.min(
                Math.floor(artSize / 2),
                Math.round(
                    Math.min(w, h) *
                    P.artworkRadiusRatio
                )
            )
        )
    };
}

// -----------------------------------------------------------------------------
// Painting
// -----------------------------------------------------------------------------


let frequencyBarLevels = null;
let frequencyBarVelocity = null;
let frequencyBarTransient = null;

// Eight-band RTA-style response profiles. These don't represent actual FFT
// data; instead they give each bar the characteristic movement of its
// frequency region so the simulated display behaves more like an RTA.
// Height/energy weighting only. These values determine the typical
// vertical height of each simulated frequency band.
const frequencyBarEnergy = [
    1.00,  // 20â€“60 Hz
    0.90,  // 60â€“120 Hz
    0.72,  // 120â€“250 Hz
    0.52,  // 250â€“500 Hz
    0.34,  // 500 Hzâ€“1 kHz
    0.18,  // 1â€“2 kHz
    0.075, // 2â€“5 kHz
    0.030  // 5â€“20 kHz
];

// Motion only. Lower frequencies have greater inertia and therefore move
// more slowly; upper frequencies respond progressively faster.
const frequencyBarMotion = [
    { inertia: 0.965, variation: 0.28 }, // 20â€“60 Hz: slow, heavy
    { inertia: 0.945, variation: 0.30 }, // 60â€“120 Hz: somewhat slower
    { inertia: 0.915, variation: 0.34 }, // 120â€“250 Hz: low-mid
    { inertia: 0.885, variation: 0.38 }, // 250â€“500 Hz: mid
    { inertia: 0.855, variation: 0.42 }, // 500 Hzâ€“1 kHz: more active
    { inertia: 0.820, variation: 0.46 }, // 1â€“2 kHz: quicker
    { inertia: 0.785, variation: 0.50 }, // 2â€“5 kHz: faster
    { inertia: 0.745, variation: 0.54 }  // 5â€“20 kHz: fastest
];

function initFrequencyBars() {
    frequencyBarLevels = [];
    frequencyBarVelocity = [];
    frequencyBarTransient = [];

    for (let i = 0; i < frequencyBarEnergy.length; i++) {
        const energy = frequencyBarEnergy[i];
        const motion = frequencyBarMotion[i];

        // Initial height follows the frequency energy profile.
        const initial =
            energy *
            (0.68 + Math.random() * 0.32);

        frequencyBarLevels.push(
            clamp(initial, 0.015, 1.0)
        );

        frequencyBarVelocity.push(
            (Math.random() - 0.5) *
            0.055 *
            motion.variation
        );

        frequencyBarTransient.push(0);
    }
}

function updateFrequencyBars() {
    if (
        !frequencyBarLevels ||
        !frequencyBarVelocity
    ) {
        initFrequencyBars();
    }

    const count = frequencyBarEnergy.length;

    for (let i = 0; i < count; i++) {
        const energy = frequencyBarEnergy[i];
        const motion = frequencyBarMotion[i];

        if (Math.random() < 0.20) {
            const target =
                energy *
                (0.38 + Math.random() * 0.42);

            frequencyBarVelocity[i] +=
                (target - frequencyBarLevels[i]) *
                (1.0 - motion.inertia);
        }

        // Occasionally allow the two highest bands to jump sharply, giving
        // the visual impression of a cymbal/crash transient.  This is still
        // simulated and does not represent actual audio analysis.
        if (
            i >= 6 &&
            Math.random() <
                (i === 7 ? 0.012 : 0.018)
        ) {
            frequencyBarTransient[i] =
                4 + Math.floor(Math.random() * 3);

            const crashTarget =
                i === 7
                    ? 0.72 + Math.random() * 0.23
                    : 0.48 + Math.random() * 0.24;

            frequencyBarVelocity[i] +=
                (crashTarget - frequencyBarLevels[i]) *
                0.38;
        }

        frequencyBarVelocity[i] *= motion.inertia;

        frequencyBarLevels[i] +=
            frequencyBarVelocity[i];

        frequencyBarLevels[i] +=
            (Math.random() - 0.5) *
            0.018 *
            motion.variation;

        const floor =
            Math.max(
                0.015,
                energy * 0.07
            );

        if (frequencyBarTransient[i] > 0) {
            frequencyBarTransient[i]--;
        }

        const ceiling =
            frequencyBarTransient[i] > 0
                ? (
                    i === 7
                        ? 0.92
                        : 0.70
                )
                : Math.min(
                    1.0,
                    energy * 1.02
                );

        if (frequencyBarLevels[i] < floor) {
            frequencyBarLevels[i] = floor;
            frequencyBarVelocity[i] =
                Math.abs(frequencyBarVelocity[i]) * 0.5;
        }

        if (frequencyBarLevels[i] > ceiling) {
            frequencyBarLevels[i] = ceiling;
            frequencyBarVelocity[i] =
                -Math.abs(frequencyBarVelocity[i]) * 0.5;
        }
    }
}


function drawFrequencyBars(gr, x, y, w, h) {
    const count = frequencyBarEnergy.length;

    if (
        !frequencyBarLevels ||
        frequencyBarLevels.length !== count
    ) {
        initFrequencyBars();
    }

    const gap = Math.max(
        2,
        Math.round(w * 0.060)
    );

    const barW = Math.max(
        2,
        Math.floor(
            (w - gap * (count - 1)) / count
        )
    );

    const minH = Math.max(
        3,
        Math.round(h * 0.18)
    );

    const maxH = Math.max(
        minH + 2,
        Math.round(h * 0.92)
    );

    for (let i = 0; i < count; i++) {
        const normalized = clamp(
            frequencyBarLevels[i],
            0.0,
            1.0
        );

        const barH = clamp(
            Math.round(
                minH +
                (maxH - minH) *
                normalized
            ),
            minH,
            maxH
        );

        const barX =
            x +
            i * (barW + gap);

        const barY =
            y +
            h -
            barH;

        gr.FillSolidRect(
            barX,
            barY,
            barW,
            barH,
            P.mutedText
        );
    }
}



// Return the small rectangle occupied by the currently displayed EQ bars.
// rowRects is populated during the most recent panel paint, so this lookup
// avoids scanning the complete album on every animation timer tick.
function getFrequencyBarRect() {
    if (
        !P.showFrequencyBars ||
        !fb.IsPlaying ||
        !rowRects ||
        rowRects.length === 0
    ) {
        return null;
    }

    let currentRow = null;

    for (let i = 0; i < rowRects.length; i++) {
        const row = rowRects[i];

        if (
            nowPlaying &&
            albumTracks &&
            row.index >= 0 &&
            row.index < albumTracks.Count &&
            sameHandle(albumTracks[row.index], nowPlaying)
        ) {
            currentRow = row;
            break;
        }
    }

    if (!currentRow) return null;

    const L = getLayout();

    const frequencyW = Math.max(
        38,
        Math.min(
            58,
            Math.round(L.w * 0.050)
        )
    );

    const frequencyGap = Math.max(
        6,
        Math.round(L.w * 0.010)
    );

    const barH = Math.max(
        7,
        Math.round(L.rowH * 0.52)
    );

    return {
        x: L.artX - frequencyW - frequencyGap,
        y:
            currentRow.y +
            Math.max(
                3,
                Math.round(L.rowH * 0.10)
            ),
        w: frequencyW,
        h: barH
    };
}


// ---------------------------------------------------------------------------
// Interactive font scaling
// ---------------------------------------------------------------------------

const FONT_SCALE_MIN = 0.5;
const FONT_SCALE_MAX = 2.0;
const FONT_SCALE_STEP = 0.1;

// Diagnostic logging is disabled in the release build.
// The debugLog() calls are retained so diagnostic logging can be re-enabled
// easily if another stability investigation is required.
const DEBUG_LOGGING = false;

function debugLog(message) {
    if (!DEBUG_LOGGING) return;
    try {
        if (typeof console !== 'undefined' && console.log) {
            console.log('[SMP Album Visualizer] ' + message);
        }
    } catch (e) {
        // Diagnostics must never interfere with panel operation.
    }
}

let fontScaleSaveTimer = null;
let fontRepaintTimer = null;
const FONT_SCALE_SAVE_DELAY = 250;

function requestFontRepaint(reason) {
    debugLog("Font repaint REQUEST: " + reason);
    if (fontRepaintTimer) {
        debugLog("Font repaint COALESCE: existing request pending");
        return;
    }
    fontRepaintTimer = window.SetTimeout(function () {
        fontRepaintTimer = null;
        debugLog("Font repaint CALL: window.Repaint()");
        window.Repaint();
        debugLog("Font repaint RETURN: window.Repaint()");
    }, 0);
}

function scheduleFontScaleSave(propertyKey, value) {
    const propertyNames = {
        artistScale: 'TEXT | Artist font scale',
        trackScale: 'TEXT | Track font scale'
    };

    if (fontScaleSaveTimer) {
        window.ClearTimeout(fontScaleSaveTimer);
        fontScaleSaveTimer = null;
    }

    debugLog('Font property SAVE SCHEDULE: ' + propertyNames[propertyKey] + ' = ' + value);

    fontScaleSaveTimer = window.SetTimeout(function () {
        fontScaleSaveTimer = null;
        debugLog('Font property SAVE BEGIN: ' + propertyNames[propertyKey] + ' = ' + P[propertyKey]);
        window.SetProperty(propertyNames[propertyKey], String(P[propertyKey]));
        debugLog('Font property SAVE END: ' + propertyNames[propertyKey]);
    }, FONT_SCALE_SAVE_DELAY);
}

function flushFontScaleSave() {
    if (!fontScaleSaveTimer) return;

    window.ClearTimeout(fontScaleSaveTimer);
    fontScaleSaveTimer = null;

    debugLog('Font property SAVE FLUSH BEGIN');
    window.SetProperty('TEXT | Artist font scale', String(P.artistScale));
    window.SetProperty('TEXT | Track font scale', String(P.trackScale));
    debugLog('Font property SAVE FLUSH END: trackScale=' + P.trackScale + ', artistScale=' + P.artistScale);
}

function getArtistMaxScale() {
    const panelScale = clamp(
        Math.max(1, window.Height) / 250,
        0.70,
        2.80
    );

    // Artist and Album share one scale. The Artist font has the controlling
    // practical ceiling for this shared control. The Album font retains its
    // existing 36 px draw-time ceiling, but it must not prevent the Artist
    // font from scaling further.
    const artistMaxScale = 52 / (17.5 * panelScale);

    return Math.min(
        FONT_SCALE_MAX,
        artistMaxScale
    );
}

function adjustFontScale(propertyKey, delta) {
    const oldValue = Number(P[propertyKey]);
    debugLog('Font scale adjustment BEGIN: ' + propertyKey + ' old=' + oldValue + ' delta=' + delta);

    let value = oldValue;

    if (!isFinite(value)) {
        value = 1.0;
    }

    value += delta;

    let maxScale = FONT_SCALE_MAX;

    if (propertyKey === 'artistScale') {
        maxScale = getArtistMaxScale();
    }

    if (propertyKey === 'trackScale') {
        const panelScale = clamp(
            Math.max(1, window.Height) / 250,
            0.70,
            2.80
        );

        // The Track font itself is capped at 30 px. Because Subtitle
        // follows this same scale, the shared scale must stop when the
        // Track font reaches that cap.
        const trackMaxScale = 30 / (11.0 * panelScale);

        maxScale = Math.min(
            FONT_SCALE_MAX,
            trackMaxScale
        );
    }

    value = Math.max(
        FONT_SCALE_MIN,
        Math.min(
            maxScale,
            Math.round(value * 10) / 10
        )
    );

    // Once the scale is at its limit, do nothing. In particular, don't
    // rebuild fonts, schedule a property write, or request a repaint when
    // the value has not actually changed.
    if (value === oldValue) {
        debugLog('Font scale adjustment NO-OP: ' + propertyKey + ' value=' + value + ' max=' + maxScale);
        return;
    }

    P[propertyKey] = value;

    rebuildFontPair(propertyKey);
    scheduleFontScaleSave(propertyKey, value);
    requestFontRepaint('font scale adjustment: ' + propertyKey);

    debugLog('Font scale adjustment END: ' + propertyKey + ' new=' + P[propertyKey] + ' max=' + maxScale);
}
function syncFontScalesFromProperties() {
    const propertyNames = {
        artistScale: 'TEXT | Artist font scale',
        trackScale: 'TEXT | Track font scale'
    };

    const artistRaw = window.GetProperty(propertyNames.artistScale, String(P.artistScale));
    const trackRaw = window.GetProperty(propertyNames.trackScale, String(P.trackScale));

    const artistText = String(artistRaw == null ? '' : artistRaw).trim();
    const trackText = String(trackRaw == null ? '' : trackRaw).trim();

    let artistScale = Number(artistText);
    let trackScale = Number(trackText);

    if (artistText === '' || !isFinite(artistScale)) {
        debugLog('Font scale property INVALID after dialog: ' + propertyNames.artistScale + ' raw="' + artistText + '" fallback=' + P.artistScale);
        artistScale = P.artistScale;
        window.SetProperty(propertyNames.artistScale, String(artistScale));
    }

    if (trackText === '' || !isFinite(trackScale)) {
        debugLog('Font scale property INVALID after dialog: ' + propertyNames.trackScale + ' raw="' + trackText + '" fallback=' + P.trackScale);
        trackScale = P.trackScale;
        window.SetProperty(propertyNames.trackScale, String(trackScale));
    }

    artistScale = clamp(
        artistScale,
        FONT_SCALE_MIN,
        getArtistMaxScale()
    );

    const panelScale = clamp(
        Math.max(1, window.Height) / 250,
        0.70,
        2.80
    );

    const trackMaxScale = 30 / (11.0 * panelScale);

    trackScale = clamp(
        trackScale,
        FONT_SCALE_MIN,
        Math.min(FONT_SCALE_MAX, trackMaxScale)
    );

    const changed =
        artistScale !== P.artistScale ||
        trackScale !== P.trackScale;

    P.artistScale = artistScale;
    P.trackScale = trackScale;

    if (changed) {
        rebuildFonts();
        requestFontRepaint('Properties synchronization');
    }
}

function rebuildFontPair(propertyKey) {
    const h = Math.max(1, window.Height);
    const scale = clamp(h / 250, 0.70, 2.80);

    if (propertyKey === 'artistScale') {
        const artistSize = clamp(
            17.5 * scale * P.artistScale,
            11,
            52
        );

        const albumSize = clamp(
            13.0 * scale * P.artistScale,
            9,
            36
        );

        fonts.artist = createFont(
            artistSize,
            P.artistWeight,
            P.artistFontName
        );

        fonts.album = createFont(
            albumSize,
            0
        );

        return;
    }

    if (propertyKey === 'trackScale') {
        const trackSize = clamp(
            11.0 * scale * P.trackScale,
            8,
            30
        );

        const subtitleScale = P.trackScale * 0.5;

        const subtitleSize = clamp(
            11.0 * scale * subtitleScale,
            6,
            24
        );

        fonts.track = createFont(
            trackSize,
            0
        );

        // Current-track text uses the same font as normal Track text.
        // Reuse the object instead of creating a second identical GDI font.
        fonts.currentTrack = fonts.track;

        fonts.subtitle = createFont(
            subtitleSize,
            0
        );
    }
}

function getFontScaleTarget(x, y) {
    // Header geometry is cached from the same measured rectangles used by
    // on_paint_content(). Artist and Album share one horizontal header line.
    if (fontScaleHeaderRects) {
        const artist = fontScaleHeaderRects.artist;

        if (
            artist &&
            x >= artist.x &&
            x < artist.x + artist.w &&
            y >= artist.y &&
            y < artist.y + artist.h
        ) {
            return 'artistScale';
        }

        const album = fontScaleHeaderRects.album;

        if (
            album &&
            x >= album.x &&
            x < album.x + album.w &&
            y >= album.y &&
            y < album.y + album.h
        ) {
            return 'artistScale';
        }
    }

    // Track/subtitle geometry follows the actual row rectangles and the
    // subtitle state captured while each row was drawn.
    for (let i = 0; i < rowRects.length; i++) {
        const row = rowRects[i];

        if (
            x >= row.x &&
            x < row.x + row.w &&
            y >= row.y &&
            y < row.y + row.h
        ) {
            const titleH = row.subtitle
                ? Math.floor(row.h * 0.61)
                : row.h;

            if (y < row.y + titleH) {
                return 'trackScale';
            }

            if (row.subtitle) {
                const subtitleY = row.y + Math.floor(row.h * 0.56);
                const subtitleH = Math.floor(row.h * 0.42);

                if (
                    y >= subtitleY &&
                    y < subtitleY + subtitleH
                ) {
                    return 'trackScale';
                }
            }
        }
    }

    return null;
}

// Album and subtitle scales are now tied to Artist and Track scales.
// Remove the old independent properties from prior revisions.
window.SetProperty('TEXT | Album font scale', undefined);

// ---------------------------------------------------------------------------
// Built-in Help / Documentation
// ---------------------------------------------------------------------------

const HELP = {
    title: 'SMP Album Visualizer for Foobar2000 - Help',
    sections: [
        {
            title: 'Overview',
            text:
                'Displays album artwork, a blurred artwork-derived background, ' +
                'album and artist information, a track list, playback indicators, ' +
                'a track-count badge and an eight-band simulated RTA-style animation.'
        },
        {
            title: 'Artwork',
            text:
                'Left-clicking the artwork centers the currently playing track ' +
                'in this panel\'s track list. Artwork corner radius applies to the ' +
                'cover only. Embedded artwork is preferred; configured fallback ' +
                'artwork and NO COVER text are used when appropriate.'
        },
        {
            title: 'Track List',
            text:
                'Tracks display a number, title and optional subtitle/tag line. ' +
                'Hovering updates the hover indicator. Double-clicking a displayed ' +
                'track plays it. Right-clicking within the track list retains the ' +
                'normal foobar2000 track context menu.'
        },
        {
            title: 'Subtitle',
            text:
                'When TRACK | Show subtitle/tag line is enabled, TRACK | Subtitle ' +
                'title format determines the secondary line. Its default is ' +
                '%subtitle%, but any foobar2000 title-format expression may be used, ' +
                'such as %genre%, %date%, %style% or a conditional expression.'
        },
        {
            title: 'Frequency Bars',
            text:
                'Eight simulated frequency bands provide an RTA-style display. ' +
                'Bass and mid-bass have greater apparent height/energy, while ' +
                'movement becomes faster toward the treble. The highest two bands ' +
                'can occasionally produce short transient peaks to suggest cymbal ' +
                'crashes. This is a visual simulation, not a true audio FFT analyzer.'
        },
        {
            title: 'Animation',
            text:
                'Frequency-bar animation can be enabled or disabled. It runs only ' +
                'while playback is active; pausing or stopping playback freezes the ' +
                'bars. The timer interval controls update frequency. Very small timer ' +
                'intervals update the simulation rapidly, while repainting is throttled ' +
                'and limited to the small EQ-bar rectangle to protect mouse/menu ' +
                'responsiveness. Mouse movement and ordinary panel repainting do not ' +
                'advance the animation.'
        },
        {
            title: 'Background',
            text:
                'The panel background is derived from the album artwork and can be ' +
                'blurred, tinted and darkened. BACKGROUND | Animate dark overlay adds ' +
                'a very slow, subtle breathing effect by varying the dark overlay alpha ' +
                'while playback is active. The configured Background dark overlay value ' +
                'remains unchanged. There is no panel-wide corner-radius setting and no ' +
                'background top/bottom gradient Property.'
        },
        {
            title: 'Properties',
            text:
                'Properties are pseudo-categorized as ANIMATION, ARTWORK, BACKGROUND, ' +
                'COLORS, FONTS, FORMATS, LAYOUT, NAVIGATION, TEXT and TRACK. The ' +
                'current EQ/frequency timer default is 40 ms, artwork corner radius ' +
                'default is 0.04, and Background overlay animation is disabled by ' +
                'default. Hold Ctrl and rotate the mouse wheel over Artist or Album ' +
                'text to change both together by 0.1, or over Track or Subtitle text ' +
                'to change both together by 0.1. Subtitle text is sized internally at ' +
                'one-half of the Track scale; the shared scale range is 0.5 through 2.0.'
        },
        {
            title: 'Context Menu',
            text:
                'Right-clicking a track retains the normal foobar2000 track menu. ' +
                'Right-clicking elsewhere opens the Help / Resources menu. Its first ' +
                'item is Help / Documentation, followed by external documentation ' +
                'links and panel commands including Reload, Open component folder, ' +
                'Panel properties and Configure.'
        },
        {
            title: 'Help / Documentation',
            text:
                'This Help window is displayed by Spider Monkey Panel itself using ' +
                'fb.ShowPopupMessage(). No external Markdown viewer, browser or other ' +
                'program is required.'
        }
    ]
};

function showHelp() {
    const text = HELP.sections.map(function (section) {
        return section.title.toUpperCase() + '\n' + section.text;
    }).join('\n\n');

    try {
        fb.ShowPopupMessage(text, HELP.title);
    } catch (e) {
        // Help remains non-destructive if the host does not expose the method.
    }
}

function on_paint_content(gr) {
    if (fontsDirty) {
        rebuildFonts();
    }

    const L = getLayout(gr);

    rowRects = [];

    // Full-panel background derived from the current album artwork.
    // It is heavily blurred so the artwork provides the colour/atmosphere
    // without competing with the readable foreground content.
    rebuildBlurredBackground();

    if (blurredBackground) {
        gr.SetInterpolationMode(7);
        gr.DrawImage(
            blurredBackground,
            -1,
            -1,
            L.w + 2,
            L.h + 2,
            0,
            0,
            blurredBackground.Width,
            blurredBackground.Height,
            0,
            255
        );

        // Darken the blurred art to reproduce the subdued SMP visualizer
        // background and maintain text contrast.
        gr.FillSolidRect(
            -1,
            -1,
            L.w + 2,
            L.h + 2,
            getAnimatedBackgroundOverlay()
        );

        // Very subtle cool/purple veil.
        gr.FillSolidRect(
            -1,
            -1,
            L.w + 2,
            L.h + 2,
            P.bgGlow
        );
    } else {
        // Fallback while artwork is loading.
        gr.FillGradRect(
            -1,
            -1,
            L.w + 2,
            L.h + 2,
            90,
            RGBA(25, 25, 31, 255),RGBA(10, 10, 14, 255));
    }

    if (
        !nowPlaying &&
        (!albumTracks || albumTracks.Count === 0)
    ) {
        drawText(
            gr,
            'Nothing is playing',
            fonts.album,
            P.mutedText,
            L.margin,
            0,
            L.w - L.margin * 2,
            L.h,
            DT_LEFT |
            DT_VCENTER |
            DT_SINGLELINE |
            DT_NOPREFIX
        );

        return;
    }

    // -------------------------------------------------------------------------
    // Header
    // -------------------------------------------------------------------------

    // The header is intentionally independent of the track-list/artwork split.
    // Artist and Album can therefore use the full panel width.  The cover does
    // not truncate the header; only the actual right edge of the panel does.
    const headerX = Math.max(
        L.margin,
        Math.round(L.w * P.headerLeftMargin)
    );

    const headerW = Math.max(
        40,
        L.w - headerX - L.margin
    );

    const artistUpper = albumArtist.toUpperCase();

    // Artist gets its own full-width drawing rectangle.  Its font is large
    // and bold; DT_END_ELLIPSIS handles only genuine panel-edge overflow.
    drawFormattedTrackTitle(
        gr,
        artistUpper,
        fonts.artist,
        P.artistText,
        headerX,
        Math.round(L.margin * 0.15),
        headerW,
        L.headerH,
        DT_LEFT |
        DT_VCENTER |
        DT_SINGLELINE |
        DT_END_ELLIPSIS |
        DT_NOPREFIX
    );

    // Album title is drawn immediately after the artist on the same line.
    // Measure the actual artist text so the title follows it naturally.
    const artistMeasured = textWidth(
        gr,
        artistUpper,
        fonts.artist
    );

    const titleX = Math.min(
        headerX + artistMeasured + Math.max(2, P.albumTitleGap),
        headerX + headerW - 20
    );

    const titleW = Math.max(
        20,
        headerX + headerW - titleX
    );

    // Cache the actual header text rectangles for Ctrl + mouse-wheel hit
    // testing. Artist and Album are on the same horizontal line.
    fontScaleHeaderRects = {
        artist: {
            x: headerX,
            y: Math.round(L.margin * 0.15),
            w: Math.min(artistMeasured, headerW),
            h: L.headerH
        },
        album: {
            x: titleX,
            y: Math.round(L.margin * 0.15),
            w: titleW,
            h: L.headerH
        }
    };

    let titleWithFormat = albumTitle;

    try {
        titleWithFormat = evalTF(
            albumTitleTF,
            nowPlaying,
            ''
        );

        if (!titleWithFormat) {
            titleWithFormat = albumTitle;
        }
    } catch (e) {
        titleWithFormat = albumTitle;
    }

    // Keep Artist and Album in the same header text rectangle.  With
    // DT_VCENTER this gives the two font faces a common visual center; the
    // previous font-height-based positioning pushed the larger album font
    // below the Artist baseline.
    drawFormattedTrackTitle(
        gr,
        titleWithFormat,
        fonts.album,
        P.albumText,
        titleX,
        Math.round(L.margin * 0.15),
        titleW,
        L.headerH,
        DT_LEFT |
        DT_VCENTER |
        DT_SINGLELINE |
        DT_END_ELLIPSIS |
        DT_NOPREFIX
    );

    // -------------------------------------------------------------------------
    // Artwork
    // -------------------------------------------------------------------------

    try {
        gr.FillRoundRect(
            L.artX,
            L.artY,
            L.artSize,
            L.artSize,
            L.artRadius,
            L.artRadius,
            RGBA(0, 0, 0, 70)
        );
    } catch (e) {
        gr.FillSolidRect(
            L.artX,
            L.artY,
            L.artSize,
            L.artSize,
            RGBA(0, 0, 0, 70)
        );
    }

    if (artwork) {
        const roundedArtwork = getRoundedArtwork(
            L.artSize,
            L.artRadius
        );

        if (roundedArtwork) {
            gr.DrawImage(
                roundedArtwork,
                L.artX,
                L.artY,
                L.artSize,
                L.artSize,
                0,
                0,
                L.artSize,
                L.artSize,
                0,
                255
            );
        } else {
            // Fall back to the normal artwork path if masking fails.
            drawArtwork(
                gr,
                artwork,
                L.artX,
                L.artY,
                L.artSize,
                255
            );
        }
    } else {
        drawText(
            gr,
            'NO ART',
            fonts.album,
            P.mutedText,
            L.artX,
            L.artY,
            L.artSize,
            L.artSize,
            DT_CENTER |
            DT_VCENTER |
            DT_SINGLELINE |
            DT_NOPREFIX
        );
    }

    try {
        gr.DrawRoundRect(
            L.artX,
            L.artY,
            L.artSize - 1,
            L.artSize - 1,
            L.artRadius,
            L.artRadius,
            1,
            P.artworkBorder
        );
    } catch (e2) {
        // Ignore.
    }

    // -------------------------------------------------------------------------
    // Album track-count badge
    // -------------------------------------------------------------------------

    if (
        P.showTrackCountBadge &&
        albumTracks &&
        albumTracks.Count > 0
    ) {
        const badgeText = String(
            albumTracks.Count
        ) + ' tracks';

        // Reuse the shared GDI font cache.  These fonts used to be created
        // directly on every paint, which can exhaust GDI font resources when
        // the animation causes frequent repaints.
        const badgeFont = createFont(
            Math.max(
                10,
                Math.round(
                    Math.min(L.w, L.h) * 0.025
                )
            ),
            1,
            'Roboto'
        );

        const badgeIconFont = createFont(
            Math.max(
                12,
                Math.round(
                    Math.min(L.w, L.h) * 0.030
                )
            ),
            0,
            'Segoe Fluent Icons'
        );

        const badgeH = Math.max(
            22,
            Math.round(L.h * 0.045)
        );

        const badgeTextW = gr.MeasureString
            ? gr.MeasureString(
                badgeText,
                badgeFont,
                0,
                0,
                300,
                badgeH
            ).Width
            : Math.round(L.w * 0.11);

        const badgeIconW = Math.max(
            18,
            Math.round(L.w * 0.024)
        );

        const badgePad = Math.max(
            8,
            Math.round(L.w * 0.009)
        );

        const badgeW =
            badgePad * 2 +
            badgeIconW +
            5 +
            Math.max(
                45,
                badgeTextW
            );

        // Match the artwork's right margin exactly: use the same
        // track-list margin that positions the cover's right edge.
        const badgeRightMargin = Math.max(
            L.margin,
            Math.round(
                L.w * P.trackListLeftMargin
            )
        );

        const badgeX =
            L.w -
            badgeRightMargin -
            badgeW;

        const badgeY =
            L.h -
            L.margin -
            badgeH;

        try {
            gr.FillRoundRect(
                badgeX,
                badgeY,
                badgeW,
                badgeH,
                badgeH / 2,
                badgeH / 2,
                RGBA(0, 0, 0, 105)
            );
        } catch (e) {
            gr.FillSolidRect(
                badgeX,
                badgeY,
                badgeW,
                badgeH,
                RGBA(0, 0, 0, 105)
            );
        }

        if (badgeIconFont) {
            gr.GdiDrawText(
                '\uE93C',
                badgeIconFont,
                P.mutedText,
                badgeX + badgePad,
                badgeY,
                badgeIconW,
                badgeH,
                DT_CENTER |
                DT_VCENTER |
                DT_SINGLELINE |
                DT_NOPREFIX
            );
        }

        gr.GdiDrawText(
            badgeText,
            badgeFont,
            P.mutedText,
            badgeX +
                badgePad +
                badgeIconW +
                5,
            badgeY,
            badgeW -
                badgePad * 2 -
                badgeIconW -
                5,
            badgeH,
            DT_LEFT |
            DT_VCENTER |
            DT_SINGLELINE |
            DT_END_ELLIPSIS |
            DT_NOPREFIX
        );
    }

    // -------------------------------------------------------------------------
    // Track list
    // -------------------------------------------------------------------------

    const maxOffset = Math.max(
        0,
        albumTracks.Count - L.visibleRows
    );

    scrollOffset = clamp(
        scrollOffset,
        0,
        maxOffset
    );

    for (
        let index = scrollOffset;
        index < albumTracks.Count;
        index++
    ) {
        const visible = index - scrollOffset;

        const y =
            L.listY +
            visible * L.rowH;

        if (y >= L.listBottom) break;

        const handle = albumTracks[index];

        let title = '';

        try {
            title = evalTF(trackTitleTF, handle, '');

            if (!title) {
                title = evalTF(TF.title, handle, 'Unknown Title');
            }
        } catch (e) {
            title = evalTF(TF.title, handle, 'Unknown Title');
        }

        let subtitle = '';

        if (P.showSubtitles) {
            subtitle = evalTF(
                TF.subtitle,
                handle,
                ''
            );

            if (
                subtitle === '?' ||
                subtitle === '[?]' ||
                subtitle.toLowerCase() === 'unknown'
            ) {
                subtitle = '';
            }
        }

        const trackNo = evalTF(
            TF.track,
            handle,
            ''
        );

        const number =
            trackNo ||
            String(index + 1);

        const isCurrent = sameHandle(
            handle,
            nowPlaying
        );

        const isHovered =
            index === hoveredTrack;

        rowRects.push({
            index: index,
            x: L.listX,
            y: y,
            w: L.listW,
            h: L.rowH,
            subtitle: !!subtitle
        });

        // Current-track strip.
        if (isCurrent) {
            try {
                // Transparent left-to-right gradient.  The stronger left
                // edge fades smoothly into the blurred-art background.
                gr.FillGradRect(
                    0,
                    y,
                    L.artX,
                    L.rowH,
                    0,
                    getGradientColour(
                        P.currentTrackBackgroundColor,
                        155,
                        0
                    ),
                    getGradientColour(
                        P.currentTrackBackgroundColor,
                        0,
                        1
                    )
                );

                // Small bright leading edge.
                if (trackIndicatorBlink) {
                    gr.FillSolidRect(
                        0,
                        y,
                        Math.max(3, Math.round(L.w * 0.003)),
                        L.rowH,
                        P.artistText
                    );
                }
            } catch (e) {
                gr.FillSolidRect(
                    0,
                    y,
                    L.artX,
                    L.rowH,
                    getGradientColour(
                        P.currentTrackBackgroundColor,
                        155,
                        0
                    )
                );
            }
        } else if (isHovered) {
            try {
                gr.FillGradRect(
                    0,
                    y,
                    L.artX,
                    L.rowH,
                    0,
                    getGradientColour(
                        P.hoverBackgroundColor,
                        70,
                        1
                    ),
                    getGradientColour(
                        P.hoverBackgroundColor,
                        0,
                        2
                    )
                );
            } catch (e2) {
                gr.FillSolidRect(
                    0,
                    y,
                    L.artX,
                    L.rowH,
                    getGradientColour(
                        P.hoverBackgroundColor,
                        70,
                        1
                    )
                );
            }
        }

        // Keep the track-title area large enough for the actual Track font.
        // The fixed 61% split is compact at the default scale, but can leave
        // descenders clipped as the Track font approaches its maximum size.
        // Use a small font-size-based floor rather than increasing every row.
        const titleH = subtitle
            ? Math.max(
                Math.floor(L.rowH * 0.61),
                Math.ceil(L.trackFontSize + 4)
            )
            : L.rowH;

        // Track number.
        drawText(
            gr,
            String(number).padStart(2, '0'),
            fonts.track,
            isCurrent
                ? P.trackText
                : P.mutedText,
            L.listX,
            y,
            L.numberW,
            titleH,
            DT_LEFT |
            DT_VCENTER |
            DT_SINGLELINE |
            DT_NOPREFIX
        );

        // Track title.
        const titleX =
            L.listX +
            L.numberW;

        const titleW =
            L.listW -
            (titleX - L.listX);

        // Reserve a small area at the right side of the current row for
        // the animated EQ bars.  Only the playing track loses title width;
        // other tracks retain the full available width.
        const frequencyW = Math.max(
            38,
            Math.min(
                58,
                Math.round(L.w * 0.050)
            )
        );

        const frequencyGap = Math.max(
            8,
            Math.round(L.w * 0.008)
        );

        const showFrequency =
            P.showFrequencyBars &&
            isCurrent &&
            fb.IsPlaying;

        const textW = showFrequency
            ? Math.max(
                20,
                titleW -
                frequencyW -
                frequencyGap
            )
            : titleW;

        drawFormattedTrackTitle(
            gr,
            title,
            fonts.track,
            P.fontText,
            titleX,
            y,
            textW,
            titleH,
            DT_LEFT |
            DT_VCENTER |
            DT_SINGLELINE |
            DT_END_ELLIPSIS |
            DT_NOPREFIX
        );

        if (showFrequency) {
            drawFrequencyBars(
                gr,
                L.artX -
                    frequencyW -
                    Math.max(
                        6,
                        Math.round(L.w * 0.010)
                    ),
                y +
                    Math.max(
                        3,
                        Math.round(L.rowH * 0.10)
                    ),
                frequencyW,
                Math.max(
                    7,
                    Math.round(
                        L.rowH * 0.52
                    )
                )
            );
        }

        // Subtitle / bracketed description.
        if (subtitle) {
            const subtitleText =
                subtitle;

            drawFormattedTrackTitle(
                gr,
                subtitleText,
                fonts.subtitle,
                P.subtitleText,
                titleX,
                y + Math.floor(L.rowH * 0.56),
                textW,
                Math.floor(L.rowH * 0.42),
                DT_LEFT |
                DT_VCENTER |
                DT_SINGLELINE |
                DT_END_ELLIPSIS |
                DT_NOPREFIX
            );
        }
    }
}

// -----------------------------------------------------------------------------
// Mouse
// -----------------------------------------------------------------------------

function trackAt(x, y) {
    for (let i = 0; i < rowRects.length; i++) {
        const r = rowRects[i];

        if (
            x >= r.x &&
            x <= r.x + r.w &&
            y >= r.y &&
            y <= r.y + r.h
        ) {
            return r.index;
        }
    }

    return -1;
}


function on_paint(gr) {
    on_paint_content(gr);
}

function on_mouse_wheel(step) {
    // Ctrl + wheel adjusts the font area currently under the pointer.
    // Without Ctrl, preserve the original track-list wheel behavior.
    if (utils.IsKeyPressed(0x11)) { // VK_CONTROL
        const propertyKey = getFontScaleTarget(mouseX, mouseY);

        if (propertyKey) {
            debugLog('Ctrl+wheel: target=' + propertyKey + ' step=' + step + ' mouse=' + mouseX + ',' + mouseY);
            adjustFontScale(
                propertyKey,
                step > 0 ? FONT_SCALE_STEP : -FONT_SCALE_STEP
            );
        }

        // Ctrl + wheel is reserved for font scaling. Do not fall through to
        // playlist scrolling, even when the scale is already at its limit.
        return;
    }

    if (!albumTracks || albumTracks.Count === 0) {
        return;
    }

    const L = getLayout();

    const maxOffset = Math.max(
        0,
        albumTracks.Count - L.visibleRows
    );

    const old = scrollOffset;

    scrollOffset +=
        step > 0
            ? -P.wheelRows
            : P.wheelRows;

    scrollOffset = clamp(
        scrollOffset,
        0,
        maxOffset
    );

    if (old !== scrollOffset) {
        window.Repaint();
    }
}

let mouseX = 0;
let mouseY = 0;

function on_mouse_move(x, y) {
    mouseX = x;
    mouseY = y;

    const index = trackAt(x, y);

    if (index !== hoveredTrack) {
        hoveredTrack = index;

        window.SetCursor(
            index >= 0
                ? IDC_HAND
                : IDC_ARROW
        );

        window.Repaint();
    }
}

function on_mouse_leave() {
    if (hoveredTrack !== -1) {
        hoveredTrack = -1;
        window.SetCursor(IDC_ARROW);
        window.Repaint();
    }
}


// -----------------------------------------------------------------------------
// Playback
// -----------------------------------------------------------------------------

function playTrack(handle) {
    if (!handle) return;

    // Try direct context playback first.
    try {
        if (
            fb.RunContextCommandWithMetadb(
                'Play',
                handle,
                8
            )
        ) {
            return;
        }
    } catch (e) {
        // Continue with playlist fallback.
    }

    // Playlist fallback.
    try {
        const ap = plman.ActivePlaylist;

        if (ap < 0) return;

        const items =
            plman.GetPlaylistItems(ap);

        for (let i = 0; i < items.Count; i++) {
            if (sameHandle(items[i], handle)) {
                plman.SetPlaylistSelectionSingle(
                    ap,
                    i,
                    true
                );

                plman.SetPlaylistFocusItem(
                    ap,
                    i
                );

                plman.ExecutePlaylistDefaultAction(
                    ap,
                    i
                );

                return;
            }
        }
    } catch (e2) {
        // Nothing else to do.
    }
}

function on_mouse_lbtn_up(x, y, mask) {
    const L = getLayout();

    // Clicking the album artwork centers the current playing track
    // in this panel's track list.
    if (
        x >= L.artX &&
        x <= L.artX + L.artSize &&
        y >= L.artY &&
        y <= L.artY + L.artSize
    ) {
        centerCurrentTrack();
        return true;
    }

    return false;
}


function on_mouse_lbtn_dblclk(x, y) {
    const index = trackAt(x, y);

    if (
        index >= 0 &&
        index < albumTracks.Count
    ) {
        playTrack(albumTracks[index]);
    }
}

// -----------------------------------------------------------------------------
// Context menu
// -----------------------------------------------------------------------------


const helpLinks = [
    [
        'Spider Monkey Panel Documentation',
        'https://theqwertiest.github.io/foo_spider_monkey_panel/assets/generated_files/docs/html/index.html'
    ],
    [
        'Title Formatting Reference',
        'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Title_Formatting_Reference'
    ],
    [
        'Query Syntax',
        'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Query_syntax'
    ],
    [
        'Homepage',
        'https://www.foobar2000.org/'
    ],
    [
        'Components',
        'https://www.foobar2000.org/components'
    ],
    [
        'Wiki',
        'https://wiki.hydrogenaud.io/index.php?title=Foobar2000:Foobar2000'
    ],
    [
        'Forums',
        'https://hydrogenaud.io/index.php/board,28.0.html'
    ]
];

function runHelpLink(url) {
    try {
        const shell = new ActiveXObject(
            'Shell.Application'
        );

        shell.ShellExecute(
            url,
            '',
            '',
            'open',
            1
        );
    } catch (e) {
        // Keep the menu harmless if URL launching is unavailable.
    }
}

function showPanelProperties() {
    debugLog('Properties BEGIN: entering showPanelProperties()');

    if (fontRepaintTimer) {
        debugLog('Properties PREP: clearing pending font repaint');
        window.ClearTimeout(fontRepaintTimer);
        fontRepaintTimer = null;
    }

    // Commit any pending wheel change before opening the Properties dialog.
    // This avoids a delayed write racing with edits made inside the dialog.
    flushFontScaleSave();

    // Stop panel animation timers while an SMP modal dialog is active. This
    // avoids timer/repaint re-entry during the dialog's nested message loop.
    const resumeFrequency = !!frequencyTimer;
    const resumeIndicator = !!trackIndicatorTimer;
    const resumeBackgroundOverlay = !!backgroundOverlayTimer;

    stopFrequencyAnimation();
    stopTrackIndicatorBlink();
    stopBackgroundOverlayAnimation();

    debugLog('Properties CALL: window.ShowProperties()');

    try {
        window.ShowProperties();
        debugLog('Properties RETURN: window.ShowProperties() returned normally');
    } catch (e) {
        debugLog('Properties ERROR: ' + e);
        // Keep the menu harmless if the dialog cannot be opened.
    }

    // ShowProperties() returns after the modal dialog closes. Re-read the
    // values changed there so Apply/OK changes take effect without requiring
    // a panel reload.
    syncFontScalesFromProperties();
    debugLog('Properties SYNC: returned from Properties and synchronized font scales; trackScale=' + P.trackScale + ', artistScale=' + P.artistScale);

    if (resumeIndicator && fb.IsPlaying && !fb.IsPaused) {
        startTrackIndicatorBlink();
    }

    if (resumeFrequency && P.showFrequencyBars && fb.IsPlaying && !fb.IsPaused) {
        startFrequencyAnimation();
    }

    if (resumeBackgroundOverlay && P.animateBackgroundOverlay && fb.IsPlaying && !fb.IsPaused) {
        startBackgroundOverlayAnimation();
    }

    // Do not force a synchronous full-panel repaint here. The modal dialog
    // has just returned through a nested Windows message loop, and a forced
    // repaint at this point can interact badly with SMP/foobar2000 UI
    // processing after repeated font-scale changes. Normal invalidation will
    // repaint the panel as needed.
    debugLog('Properties REPAINT: skipped post-dialog window.Repaint()');
    debugLog('Properties END: leaving showPanelProperties()');
}

function showPanelConfigure() {
    debugLog('Configure BEGIN: entering showPanelConfigure()');

    // Commit any pending wheel change before opening the Configure dialog.
    flushFontScaleSave();

    const resumeFrequency = !!frequencyTimer;
    const resumeIndicator = !!trackIndicatorTimer;
    const resumeBackgroundOverlay = !!backgroundOverlayTimer;

    stopFrequencyAnimation();
    stopTrackIndicatorBlink();
    stopBackgroundOverlayAnimation();

    debugLog('Configure CALL: window.ShowConfigureV2()');

    try {
        window.ShowConfigureV2();
        debugLog('Configure RETURN: window.ShowConfigureV2() returned normally');
    } catch (e) {
        debugLog('Configure ERROR: ' + e);
        // Keep the menu harmless if the dialog cannot be opened.
    }

    syncFontScalesFromProperties();
    debugLog('Configure SYNC: returned from Configure and synchronized font scales; trackScale=' + P.trackScale + ', artistScale=' + P.artistScale);

    if (resumeIndicator && fb.IsPlaying && !fb.IsPaused) {
        startTrackIndicatorBlink();
    }

    if (resumeFrequency && P.showFrequencyBars && fb.IsPlaying && !fb.IsPaused) {
        startFrequencyAnimation();
    }

    if (resumeBackgroundOverlay && P.animateBackgroundOverlay && fb.IsPlaying && !fb.IsPaused) {
        startBackgroundOverlayAnimation();
    }

    // See showPanelProperties(): avoid a synchronous full-panel repaint
    // immediately after returning from the SMP modal configuration dialog.
    debugLog('Configure REPAINT: skipped post-dialog window.Repaint()');
    debugLog('Configure END: leaving showPanelConfigure()');
}

function showHelpMenu(x, y, flags) {
    const menu = window.CreatePopupMenu();

    // Built-in Help is the first menu item.
    menu.AppendMenuItem(
        MF_STRING,
        1,
        'Help / Documentation'
    );

    menu.AppendMenuSeparator();

    for (let i = 0; i < helpLinks.length; i++) {
        menu.AppendMenuItem(
            MF_STRING,
            i + 100,
            helpLinks[i][0]
        );

        // Keep Query Syntax above the external-resource separator.
        if (i === 2) {
            menu.AppendMenuSeparator();
        }
    }

    menu.AppendMenuSeparator();

    menu.AppendMenuItem(
        MF_STRING,
        2,
        'Reload'
    );

    menu.AppendMenuItem(
        MF_STRING,
        3,
        'Open component folder'
    );

    menu.AppendMenuItem(
        MF_STRING,
        4,
        'Panel properties...'
    );

    menu.AppendMenuItem(
        MF_STRING,
        5,
        'Configure...'
    );

    popupMenuActive = true;
    debugLog('Help menu BEGIN: TrackPopupMenu()');

    let id = 0;

    try {
        id = menu.TrackPopupMenu(
            x,
            y,
            flags || 0
        );
    } catch (e) {
        id = 0;
    } finally {
        popupMenuActive = false;
        debugLog('Help menu RETURN: TrackPopupMenu() returned id=' + id);
    }

    debugLog('Help menu DISPATCH: selected id=' + id);

    switch (id) {
        case 1:
            showHelp();
            break;

        case 2:
            window.Reload();
            break;

        case 3:
            try {
                const shell = new ActiveXObject(
                    'Shell.Application'
                );

                shell.Open(
                    fb.ComponentPath
                );
            } catch (e) {
                // Keep the menu harmless if Explorer cannot be opened.
            }
            break;

        case 4:
            // TrackPopupMenu has already returned here, so open the modal
            // dialog directly. The helper stops animation timers while the
            // dialog is active and synchronizes edited font-scale values when
            // it closes.
            showPanelProperties();
            break;

        case 5:
            // Use the current SMP configuration dialog.
            showPanelConfigure();
            break;

        default:
            if (
                id >= 100 &&
                id < 100 + helpLinks.length
            ) {
                runHelpLink(
                    helpLinks[id - 100][1]
                );
            }
            break;
    }
}



function on_mouse_rbtn_up(x, y) {
    const index = trackAt(x, y);
    debugLog('Right-click BEGIN: x=' + x + ' y=' + y + ' trackIndex=' + index);

    // Right-clicking an actual track opens the normal foobar2000 Context Menu
    // for that track.
    if (index >= 0 && index < albumTracks.Count) {
        const handle = albumTracks[index];

        try {
            const manager = fb.CreateContextMenuManager();

            manager.InitContext(
                new FbMetadbHandleList(handle)
            );

            const menu = window.CreatePopupMenu();

            manager.BuildMenu(
                menu,
                1,
                1000
            );

            popupMenuActive = true;
            debugLog('Track context menu BEGIN: TrackPopupMenu()');

            let commandId = 0;

            try {
                commandId = menu.TrackPopupMenu(
                    x,
                    y
                );
            } finally {
                popupMenuActive = false;
                debugLog('Track context menu RETURN: commandId=' + commandId);
            }

            if (commandId > 0) {
                debugLog('Track context menu EXECUTE: commandId=' + commandId);
                manager.ExecuteByID(commandId - 1);
                debugLog('Track context menu EXECUTE RETURN');
            }

        } catch (e) {
            debugLog('Track context menu ERROR: ' + e);
            // Do not let a context-menu failure interrupt the panel.
        }

        debugLog('Right-click END: track context menu path');
        return true;
    }

    // Everywhere outside the track list uses the Help / Resources menu.
    // The track-list right-click branch above remains unchanged.
    showHelpMenu(x, y);
    window.Repaint();
    debugLog('Right-click END: custom Help / Resources menu path');
    return true;
}

// -----------------------------------------------------------------------------
// Background overlay animation
// -----------------------------------------------------------------------------

function getAnimatedBackgroundOverlay() {
    if (
        !P.animateBackgroundOverlay ||
        !backgroundOverlayTimer
    ) {
        return P.bgOverlay;
    }

    const baseAlpha = (P.bgOverlay >>> 24) & 255;
    const offset =
        Math.sin(backgroundOverlayPhase) *
        backgroundOverlayAnimationRange;

    return RGBA(
        (P.bgOverlay >>> 16) & 255,
        (P.bgOverlay >>> 8) & 255,
        P.bgOverlay & 255,
        clamp(
            Math.round(baseAlpha + offset),
            0,
            255
        )
    );
}

function startBackgroundOverlayAnimation() {
    if (
        !P.animateBackgroundOverlay ||
        backgroundOverlayTimer
    ) {
        return;
    }

    debugLog('Background overlay animation START');

    backgroundOverlayPhase = 0;

    backgroundOverlayTimer = window.SetInterval(
        function () {
            if (popupMenuActive) return;

            if (!fb.IsPlaying || fb.IsPaused) {
                backgroundOverlayPhase = 0;
                stopBackgroundOverlayAnimation();
                window.Repaint();
                return;
            }

            backgroundOverlayPhase +=
                (Math.PI * 2 * backgroundOverlayAnimationIntervalMs) /
                backgroundOverlayAnimationCycleMs;

            if (backgroundOverlayPhase > Math.PI * 1000) {
                backgroundOverlayPhase = 0;
            }

            // The blurred bitmap is cached and is not rebuilt. Only the
            // overlay alpha changes, so this remains an intentionally low-rate
            // full-panel repaint.
            window.Repaint();
        },
        backgroundOverlayAnimationIntervalMs
    );
}

function stopBackgroundOverlayAnimation() {
    if (backgroundOverlayTimer) {
        debugLog('Background overlay animation STOP');
        window.ClearInterval(backgroundOverlayTimer);
        backgroundOverlayTimer = null;
    }

    backgroundOverlayPhase = 0;
}

// -----------------------------------------------------------------------------
// Current-track frequency-bar animation
// -----------------------------------------------------------------------------

function startFrequencyAnimation() {
    if (!P.showFrequencyBars || frequencyTimer) return;

    debugLog('Frequency animation START');

    frequencyPhase = 0;
    initFrequencyBars();

    let lastFrequencyRepaint = 0;

    frequencyTimer = window.SetInterval(
        function () {
            // Popup menus run a nested Windows message loop. Avoid repainting
            // from animation timers while a menu is active; this prevents
            // menu interaction from competing with panel redraws.
            if (popupMenuActive) return;

            if (!fb.IsPlaying || fb.IsPaused) {
                debugLog('Frequency timer detected playback inactive: IsPlaying=' + fb.IsPlaying + ' IsPaused=' + fb.IsPaused);
                const rect = getFrequencyBarRect();

                stopFrequencyAnimation();

                if (rect) {
                    window.RepaintRect(
                        rect.x,
                        rect.y,
                        rect.w,
                        rect.h
                    );
                } else {
                    window.Repaint();
                }

                return;
            }

            updateFrequencyBars();

            frequencyPhase += 0.34;

            if (frequencyPhase > Math.PI * 1000) {
                frequencyPhase = 0;
            }

            // Updating the simulation can run at the requested interval,
            // but repainting is deliberately throttled. Only the small EQ
            // rectangle is invalidated, reducing GDI/UI work compared with
            // a full-panel window.Repaint().
            const now = Date.now();

            if (
                now - lastFrequencyRepaint >= 50
            ) {
                lastFrequencyRepaint = now;

                const rect = getFrequencyBarRect();

                if (rect) {
                    window.RepaintRect(
                        rect.x,
                        rect.y,
                        rect.w,
                        rect.h
                    );
                } else {
                    window.Repaint();
                }
            }
        },
        Math.max(
            30,
            Number(P.frequencyBarInterval) || 40
        )
    );
}

function stopFrequencyAnimation() {
    if (frequencyTimer) {
        debugLog('Frequency animation STOP');
        window.ClearInterval(frequencyTimer);
        frequencyTimer = null;
    }
}

// -----------------------------------------------------------------------------
// Current-track indicator blink
// -----------------------------------------------------------------------------

function startTrackIndicatorBlink() {
    if (trackIndicatorTimer) return;

    debugLog('Track indicator timer START');

    trackIndicatorTimer = window.SetInterval(
        function () {
            if (popupMenuActive) return;

            // Do not merely stop toggling: terminate the timer itself when
            // playback is no longer active. This prevents a stale timer from
            // continuing to repaint the indicator after Stop/Pause.
            if (!fb.IsPlaying || fb.IsPaused) {
                debugLog('Track indicator timer detected playback inactive: IsPlaying=' + fb.IsPlaying + ' IsPaused=' + fb.IsPaused);
                trackIndicatorBlink = true;
                stopTrackIndicatorBlink();
                window.Repaint();
                return;
            }

            trackIndicatorBlink = !trackIndicatorBlink;
            window.Repaint();
        },
        1000
    );
}

function stopTrackIndicatorBlink() {
    if (trackIndicatorTimer) {
        debugLog('Track indicator timer STOP');
        window.ClearInterval(trackIndicatorTimer);
        trackIndicatorTimer = null;
    }
}

// -----------------------------------------------------------------------------
// foobar2000 callbacks
// -----------------------------------------------------------------------------

function on_size() {
    fontsDirty = true;
    rebuildFonts();
    rebuildTitleFormat();
    invalidateArtworkRenderCache();
    invalidateBlurredBackground();
    centerCurrentTrack();
    window.Repaint();
}

function on_playback_new_track(handle) {
    trackIndicatorBlink = true;
    startTrackIndicatorBlink();

    if (
        P.showFrequencyBars &&
        fb.IsPlaying
    ) {
        startFrequencyAnimation();
    }

    if (
        P.animateBackgroundOverlay &&
        fb.IsPlaying
    ) {
        startBackgroundOverlayAnimation();
    }

    updateAlbum(handle);
}

function on_playback_stop() {
    debugLog('Playback STOP callback');
    trackIndicatorBlink = true;
    stopTrackIndicatorBlink();
    stopFrequencyAnimation();
    stopBackgroundOverlayAnimation();
    updateAlbum(null);
}

function on_playback_pause(state) {
    debugLog('Playback PAUSE callback: state=' + state);
    trackIndicatorBlink = true;

    if (state) {
        // Paused: no blinking or frequency animation.
        stopTrackIndicatorBlink();
        stopFrequencyAnimation();
        stopBackgroundOverlayAnimation();
    } else {
        // Resumed: restart active animations.
        startTrackIndicatorBlink();
        startFrequencyAnimation();
        startBackgroundOverlayAnimation();
    }

    window.Repaint();
}

function on_metadb_changed(handleList) {
    const np = fb.GetNowPlaying();

    if (!np || !handleList) return;

    for (let i = 0; i < handleList.Count; i++) {
        if (sameHandle(handleList[i], np)) {
            updateAlbum(np);
            return;
        }
    }
}

function on_script_unload() {
    if (fontScaleSaveTimer) {
        window.ClearTimeout(fontScaleSaveTimer);
        fontScaleSaveTimer = null;
    }


    stopTrackIndicatorBlink();
    stopFrequencyAnimation();
    stopBackgroundOverlayAnimation();
    artwork = null;
    invalidateArtworkRenderCache();
    noCoverFallback = null;
    noCoverImageCache = null;
    noCoverImageCachePath = '';
    invalidateBlurredBackground();
    albumTracks = new FbMetadbHandleList();
}

// -----------------------------------------------------------------------------
// Initialisation
// -----------------------------------------------------------------------------

rebuildFonts();
rebuildTitleFormat();
startTrackIndicatorBlink();

if (
    P.showFrequencyBars &&
    fb.IsPlaying
) {
    startFrequencyAnimation();
}

if (
    P.animateBackgroundOverlay &&
    fb.IsPlaying &&
    !fb.IsPaused
) {
    startBackgroundOverlayAnimation();
}

updateAlbum(fb.GetNowPlaying());
