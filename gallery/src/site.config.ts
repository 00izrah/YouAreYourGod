/**
 * Site-wide identity. Name and domain are still open decisions (plan §11):
 * change them here and everything (nav, titles, Open Graph) follows.
 */
export const site = {
  name: 'Izrah',
  tagline: 'Photographs, shown one frame at a time.',
  description:
    'A photography gallery of finite exhibitions. Each room holds a handful of frames, shown one at a time in the dark.',
  email: 'hello@example.com',
} as const;

/** Frames are shown at these widths (filtered to the source width). */
export const imageWidths = [640, 1024, 1600, 2400] as const;

/** Per-format quality. Tuned for dark, high-contrast photographs (see scripts/compare-quality.mjs). */
export const imageQuality = { avif: 68, webp: 84, jpeg: 86 } as const;
