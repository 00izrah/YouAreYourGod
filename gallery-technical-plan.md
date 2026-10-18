# Photography Gallery — Technical Plan

## 1. Goals

- A fast, image-first static site: exhibitions of 6–12 frames, a Black Box viewing room, deep zoom, an archive, and field notes.
- Photos look as close to the originals as possible (no mushy compression, no banding in shadows) while still loading quickly on mobile.
- Adding a new exhibition should mean dropping in images and a content file, not touching code.
- No server to run. Everything is built ahead of time and served from a CDN.

## 2. Stack recommendation

| Layer | Choice | Why |
|---|---|---|
| Framework | **Astro** | Ships almost no JavaScript by default, which suits an image-heavy site; interactivity is added only where needed (the viewer). Content collections give typed, validated exhibition data. |
| Language | TypeScript | Typed content schema and viewer logic |
| Styling | Plain CSS with custom properties (or Tailwind if preferred) | The design is small and token-driven; no component library needed |
| Viewer logic | Vanilla TS module + the browser View Transitions API | Frame stepping, keyboard/swipe, preloading and crossfades don't need React |
| Heavy animation (optional) | GSAP + Lenis | Only if the horizontal-track navigation is chosen |
| 3D room (optional, later) | Three.js (or React Three Fiber as a React island) | Experimental; kept as a separate route so it can't slow the main site |
| Image pipeline | `astro:assets` (sharp) at build time, optionally Cloudinary for masters | Responsive AVIF/WebP at build time |
| Hosting | Netlify, Vercel, or Cloudflare Pages | Static output on a CDN, free tier is plenty |

Next.js would also work, but it ships a React runtime on every page and the site has very little UI state. Astro is the better fit unless you plan to build the 3D room heavily in React Three Fiber.

Since your main stack is Django: this project needs no backend. If you later want an upload/admin interface, a small Django or headless-CMS layer can sit behind the content files, but it isn't needed for v1.

## 3. Content model

Each exhibition is one Markdown/MDX file (or a JSON file) with frontmatter, validated by a Zod schema in the Astro content collection.

```ts
// src/content.config.ts
import { defineCollection, z } from 'astro:content';

const exhibitions = defineCollection({
  type: 'content',
  schema: ({ image }) => z.object({
    number: z.string(),                 // "EX-01"
    title: z.string(),
    curatorialBrief: z.string(),
    dates: z.string(),                  // "Recorded Jun – Aug 2026"
    status: z.enum(['current', 'past', 'upcoming']),
    order: z.number(),
    frames: z.array(z.object({
      id: z.string(),                   // "frame-01"
      title: z.string(),
      medium: z.string(),               // "Digital negative / 35mm equivalent"
      location: z.string(),
      date: z.coerce.date(),
      curatorialNote: z.string(),       // 2–3 sentences
      alt: z.string(),                  // real description, for accessibility
      image: image(),                   // processed by astro:assets
      dominantColor: z.string().optional(),
    })).min(1).max(12),
  }),
});

export const collections = { exhibitions };
```

The `.max(12)` is deliberate: the schema enforces the "finite exhibition" rule so a room can't quietly grow into a feed.

Other collections: `archive` (frame references with year/exhibition), `notes` (field notes entries with optional before/after images), and a single `info` page.

## 4. Routes

```
/                              Entrance (featured exhibition + index)
/exhibitions                   Directory of all exhibitions
/exhibitions/[slug]            Redirects to frame 1 of the room
/exhibitions/[slug]/[frame]    One frame + plaque (the viewing room)
/archive                       Contact-sheet grid, filterable
/notes                         Field notes index
/notes/[slug]                  A single field note
/info                          Statement + contact
/room (later, optional)        3D walkthrough
```

Each frame gets its own URL (`/exhibitions/geometry-of-midday/04`). That makes frames shareable, back/forward work naturally, and each page can have its own Open Graph image.

## 5. The viewing room (core component)

Behaviour:
- Server-render the current frame fully (image + plaque) so it works without JavaScript and is crawlable.
- Progressive enhancement: a small script intercepts next/previous, fetches or swaps to the adjacent frame, and animates with the View Transitions API (fallback: instant swap).
- Inputs: `←` / `→` keys, clicks on left/right margins, touch swipe, `Z` for deep zoom, `Esc` to close, `Home`/`End` for first/last frame.
- Preload the next and previous frame's image (`<link rel="prefetch">` or `new Image()` on idle) so stepping never shows a blank.
- Update the URL with `history.pushState` (or let View Transitions handle navigation between real pages).
- Counter and exhibition label come from the same data as the page, no separate state.

Deep-zoom viewer:
- Start simple: full-bleed `<dialog>` or fixed layer showing the largest image variant, with wheel/pinch zoom and drag pan via pointer events.
- If files are large, generate a tiled deep-zoom pyramid (e.g. with `sharp`'s DZI output) and load tiles with a small viewer library. Treat that as an upgrade, not a v1 requirement.

Navigation option still to decide (see section 11): discrete stepping (default above) vs horizontal scroll track. The data model and routes work for both.

## 6. Image pipeline

Source masters are large, so be deliberate:

1. **Masters** stay out of git. Keep them in Cloudinary, Supabase Storage, or an S3-compatible bucket (or Git LFS if you want everything in the repo).
2. **Build-time variants**: generate responsive widths (e.g. 640, 1024, 1600, 2400) in AVIF and WebP, with JPEG as the fallback. With `astro:assets`, use `<Picture>` with `formats={['avif','webp']}` and a sensible `sizes` attribute.
3. **Quality**: start AVIF around quality 60–70 and WebP around 80–85, then compare shadows at 100% on a real screen. Dark, high-contrast photos show banding first, so check gradients and deep blacks specifically.
4. **Colour**: export masters in sRGB for the web. Avoid wide-gamut files unless you handle colour profiles deliberately.
5. **Placeholders**: store a tiny blurred placeholder or the dominant colour per frame so the room never flashes white or empty while a frame loads.
6. **Metadata**: write a small script (using `exifr` or `sharp`) to read EXIF (camera, lens, capture date, location if present) and prefill the frontmatter. Review before publishing: strip GPS from the shipped files if you don't want exact locations public.

## 7. Performance and quality targets

- Largest Contentful Paint under ~2.5s on a mid-range phone for the first frame of an exhibition.
- Near-zero JavaScript on the entrance and info pages; a small module only on frame and archive pages.
- Explicit `width`/`height` (or aspect ratio) on every image to avoid layout shift.
- First frame of a room uses `fetchpriority="high"`; later frames lazy-load/prefetch.
- Fonts: self-host Cormorant Garamond and the mono face, `font-display: swap`, subset to Latin to keep them small.

## 8. Accessibility

- Real `alt` text for every photograph (stored in the schema, required).
- Full keyboard operation of stepping, zoom, and menus, with a visible focus ring (the brass accent).
- `prefers-reduced-motion`: instant cuts instead of transitions.
- Sufficient contrast for plaque text on the dark wall (Plaque Muted should still meet contrast for small text; adjust if it doesn't).
- The plaque is real text in the DOM, not baked into an image.

## 9. Optional extras

- **Horizontal track mode**: Lenis for smooth scroll plus GSAP ScrollTrigger to translate vertical scroll into horizontal movement, with centre-frame detection toggling plaque visibility.
- **2.5D WebGL depth**: render frames as planes in a DOM-synced canvas for subtle tilt/perspective and grain shaders. Load it lazily, only on the room page, behind a feature check.
- **3D room**: a minimal first-person room in Three.js with framed images and soft spotlights, on its own route, with the normal gallery as the default and fallback.
- **Field notes audio**: short audio clips per note using a plain `<audio>` element.
- **CMS**: Decap CMS or a similar git-based editor if you want to add exhibitions from a browser later.

## 10. Build roadmap

- [ ] Choose the first exhibition and curate 6–12 frames; write titles, mediums, locations and plaque text (sample content in place — replace with real work)
- [x] Scaffold Astro project, set up TypeScript, global CSS tokens (colours, type, spacing)
- [x] Define the `exhibitions` content collection and schema
- [x] Set up fonts (Cormorant Garamond + mono), self-hosted and subsetted
- [x] Build the base layout: Wall background, vignette, grain, nav
- [x] Build the frame page: image, plaque, counter, margin click targets
- [x] Add stepping: keyboard, click, swipe, preload, URL updates, View Transitions
- [x] Build the entrance and exhibitions directory
- [x] Set up the image pipeline and compare compression quality on dark images (`npm run compare-quality`; review patches on a real screen)
- [x] Build the deep-zoom viewer
- [x] Build archive and field notes pages
- [ ] Accessibility and reduced-motion pass; test on a real phone
- [ ] Deploy to Netlify/Vercel/Cloudflare Pages, connect a domain
- [ ] (Later) horizontal track mode, 2.5D depth, 3D room

## 11. Open decisions

- **Navigation model**: the brainstorm ended on a choice between the horizontal curated track and discrete room-by-room stepping, and it wasn't settled. This plan defaults to discrete stepping (best for focus, simplest to build and to make accessible), with the horizontal track as an optional second mode.
- **Where masters live**: Cloudinary vs Supabase Storage vs Git LFS. Depends on how many photos and how much you want to manage.
- **Framework**: Astro is recommended here; pick Next.js instead only if you want React Three Fiber as the centrepiece.
- **Domain and name**: the site needs a name and a domain before the Open Graph images and the entrance title card can be finalised.
