# Photography Gallery — UI/Design Plan

## Concept: a dark room where the photographs are the only light

This is not a portfolio with a dark theme. It's a viewing room. The screen is dimmed, the walls are near-black, and each photograph glows as if it were the one lit object in the space. Everything else (navigation, text, counters) is quiet, small, and slightly dimmed so it never competes with the work.

Direction carried over from the brainstorm:
- **Exhibition-based structure** — named exhibitions of 6–12 frames, not an endless feed or generic "Street / Portraits" tabs.
- **Curatorial plaque** beside each frame — title, medium, location, a short wall text.
- **Black Box lighting mode** — dark canvas, spotlight vignette, images as the primary light source.

## Color

| Name | Hex | Role |
|---|---|---|
| Wall | `#0B0B0A` | Page background — warm off-black, not pure `#000`, so true blacks inside photos still read as deeper |
| Wall Raised | `#121211` | Subtle surfaces (index rows, lightbox backdrop) |
| Hairline | `rgba(255,255,255,0.08)` | Frame border / mat edge, dividers |
| Plaque Text | `#E6E1D8` | Titles and primary text — warm white, never pure white |
| Plaque Muted | `#8C877E` | Metadata, counters, secondary labels |
| Brass | `#B59B6B` | The single accent: active nav item, current frame marker, focus ring |

One accent only, and it's used for state ("you are here"), never decoration. If a screen has no active state, no brass appears.

## Type

- **Titles / wall text**: Cormorant Garamond (Medium for titles, Regular Italic for curatorial notes). Large optical size, tight tracking. This is the plaque voice.
- **Metadata / UI**: Geist Mono (or JetBrains Mono as fallback) at 11–12px for medium, location, date, frame counter. Reads like a museum catalogue number.

Two typefaces, strict roles: serif speaks, mono labels. No third face, no bold weights in the mono.

Counter format: `04 / 09` — plain, no ornament. Exhibition label: `EX-01 · The Geometry of Midday`.

## Spotlight and framing

- **Spotlight vignette**: a fixed radial gradient behind the active frame, roughly `radial-gradient(circle at 50% 45%, rgba(255,255,255,0.035) 0%, transparent 70%)`. It should be barely perceptible; if you can point at it, it's too strong.
- **Frame size**: photograph sits at about 65–75% of viewport height, with at least 15–20% empty wall around it. Negative space is part of the composition.
- **Mat / border**: 1px hairline around the image, no drop shadow (a shadow on a dark wall reads as a web effect, not a physical print).
- **Grain**: very light film-grain overlay on the wall only (not on the photo) to stop the background looking like flat CSS.

## Screens

### 1. Entrance (home)
A quiet title card, not a hero banner. Photographer name small, top-left. A single line of intro. Below, the exhibitions listed as an index.

```
┌──────────────────────────────────────────────┐
│ [name]                  Exhibitions  Archive  Info │
│                                                    │
│                                                    │
│      Currently showing                             │
│      The Geometry of Midday                        │
│      EX-01 · 9 frames · Jun – Aug 2026             │
│      [ Enter the room ]                            │
│                                                    │
│      ───────────────────────────────               │
│      EX-02  Echoes & Silhouettes      7 frames     │
│      EX-03  (upcoming)                              │
└──────────────────────────────────────────────┘
```
The featured exhibition is large type with one lit thumbnail beside it. The rest are index rows, like a museum directory.

### 2. Exhibition room (main viewing screen)
Discrete, one frame at a time. The viewer can't see frame 3 while looking at frame 2.

```
┌──────────────────────────────────────────────┐
│ [name]    Exhibitions  Archive  Info    EX-01 · Geometry of Midday │
│                                                    │
│              ┌──────────────┐                      │
│              │              │                      │
│              │   photograph │                      │
│              │              │                      │
│              └──────────────┘                      │
│              04 · Intersection at 1:14 PM          │
│              Digital negative · Lagos · 2026       │
│              wall text in italic serif, 2–3 lines  │
│                                          04 / 09   │
└──────────────────────────────────────────────┘
```
- Plaque sits flush-left beneath the frame (desktop) so the eye drops straight from image to text.
- Left/right screen margins are the click targets; arrow keys and swipe also navigate.
- Counter bottom-right in mono, brass only on the current number.

### 3. Deep-zoom viewer
Click or press `Z` on a frame to enter a full-bleed viewer. Backdrop goes to Wall Raised at ~96% opacity, image scales to fit, pinch/scroll zooms, drag pans. Close with `Esc` or a small `×`. Plaque hides while zoomed.

### 4. Archive (the permanent collection)
The one place a grid is allowed. Sparse contact-sheet layout: uneven gutters, no captions until hover/focus, thumbnails desaturate slightly until hovered. Filter by exhibition or year, not by "category".

### 5. Darkroom / Field notes
A notebook-like page for context: before/after tones, a short note on the moment of capture, lighting breakdowns. Typographically the same system, but the serif runs in longer paragraphs and images sit inline. This is where personality gets to speak.

### 6. Info
Short statement, contact, and a plain list of exhibitions. No skill bars, no logos strip.

## Motion

- **Frame transition**: crossfade with a very slight scale (0.985 → 1) over ~500ms, `ease-out`. The outgoing frame fades faster than the incoming one so the room briefly dims between photographs.
- **Plaque**: fades up ~150ms after the image settles, so the image always arrives first.
- **Optional horizontal track mode** (if chosen): neighbouring frames sit at 40% opacity and scale 0.95, the centred one brightens and its plaque appears.
- **Reduced motion**: respect `prefers-reduced-motion` — swap to instant cuts, keep the opacity change.

No parallax on text, no hover-lift on index rows, no cursor-follower blobs.

## Mobile

- Same one-frame-at-a-time model. Swipe left/right to change frame, tap to toggle the plaque, double-tap or pinch for deep zoom.
- Plaque collapses to title + location by default; tap to expand the wall text.
- Counter moves to bottom-centre. Navigation collapses to a single `Menu` word, not a hamburger icon.
- Keep safe-area padding so the frame never touches a notch or home indicator.

## Principles

1. **The photograph is the light source.** Anything brighter than the image's highlights is wrong.
2. **One frame, full attention.** Never show two photographs in the same view in the exhibition room.
3. **Plaque, not caption.** Text is written like wall text: restrained, specific, a little formal.
4. **One accent, used for state.** Brass means "current," nothing else.
5. **Space is the frame.** Generous empty wall around every image.

## Self-check against generic dark-portfolio defaults

- Not a card grid of thumbnails on the home page — exhibitions are a directory, the featured one is a title card.
- Not pure black with neon or gradient accents — warm off-black with a single muted brass.
- No glassmorphism, no glow shadows, no hover-lift on everything.
- Serif is used for voice (titles, wall text), not as a decorative "luxury" gesture on every label.
- Motion is limited to the frame transition and plaque reveal.
