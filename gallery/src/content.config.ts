import { defineCollection, z } from 'astro:content';
import { glob } from 'astro/loaders';

/** Maximum frames per room. Enforces the "finite exhibition" rule. */
export const MAX_FRAMES = 12;

const exhibitions = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/exhibitions' }),
  schema: ({ image }) =>
    z
      .object({
        number: z.string(), // "EX-01"
        title: z.string(),
        curatorialBrief: z.string(),
        dates: z.string(), // "Recorded Jun – Aug 2026"
        status: z.enum(['current', 'past', 'upcoming']),
        order: z.number(),
        frames: z
          .array(
            z.object({
              id: z.string(), // "frame-01"
              title: z.string(),
              medium: z.string(), // "Digital negative / 35mm equivalent"
              location: z.string(),
              date: z.coerce.date(),
              curatorialNote: z.string(), // 2–3 sentences
              alt: z.string().min(12, 'Write a real description of the photograph'),
              image: image(), // processed by astro:assets
              dominantColor: z.string().optional(), // placeholder colour while loading
            }),
          )
          .max(MAX_FRAMES, `A room holds at most ${MAX_FRAMES} frames.`),
      })
      .refine((e) => e.status === 'upcoming' || e.frames.length >= 1, {
        message: 'Only upcoming exhibitions may have no frames yet.',
        path: ['frames'],
      }),
});

const notes = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/notes' }),
  schema: ({ image }) =>
    z.object({
      title: z.string(),
      date: z.coerce.date(),
      summary: z.string(),
      /** Optional "frame" reference: exhibition slug + frame number. */
      relatedExhibition: z.string().optional(),
      relatedFrame: z.number().int().positive().optional(),
      /** Optional before/after tones. */
      before: z.object({ image: image(), alt: z.string() }).optional(),
      after: z.object({ image: image(), alt: z.string() }).optional(),
    }),
});

const info = defineCollection({
  loader: glob({ pattern: '**/*.md', base: './src/content/info' }),
  schema: z.object({
    title: z.string(),
    email: z.string().email().optional(),
  }),
});

// The archive is derived from `exhibitions` (every frame, by year and exhibition),
// so there is a single source of truth and nothing to keep in sync.
export const collections = { exhibitions, notes, info };
