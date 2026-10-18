# Gallery

Static photography gallery built with Astro. See `../gallery-technical-plan.md` and `../gallery-design-plan.md`.

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # type-check + static build into dist/
npm run preview
```

## Adding an exhibition

1. Put the images in `src/assets/exhibitions/<slug>/`.
2. Run `npm run frame-meta -- src/assets/exhibitions/<slug>/*.jpg` to get a frontmatter stub
   (EXIF date/camera + a placeholder colour per frame).
3. Create `src/content/exhibitions/<slug>.md` (copy an existing one). The schema enforces 1–12 frames
   and a real `alt` description per photograph.

No code changes needed: the room, directory, archive and entrance pick it up.

## Image quality

Variants (AVIF q68 / WebP q84 / JPEG q86 at 640–2400px) are built by `src/components/FramePicture.astro`;
tune them in `src/site.config.ts`. To check shadows for banding:
`npm run compare-quality -- <image>` writes lifted shadow patches to `quality-test/`.

## Identity

Site name, tagline and email live in `src/site.config.ts`; the domain in `astro.config.mjs` (`site`).
Photos and text currently in `src/content` are sample content.
