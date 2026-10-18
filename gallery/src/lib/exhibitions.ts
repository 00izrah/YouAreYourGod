import { getCollection, type CollectionEntry } from 'astro:content';

export type Exhibition = CollectionEntry<'exhibitions'>;
export type Frame = Exhibition['data']['frames'][number];

export const pad = (n: number) => String(n).padStart(2, '0');

export const frameUrl = (exhibitionId: string, index: number) => `/exhibitions/${exhibitionId}/${pad(index + 1)}`;

export async function getExhibitions(): Promise<Exhibition[]> {
  return (await getCollection('exhibitions')).sort((a, b) => a.data.order - b.data.order);
}

/** The featured exhibition: the current one, else the latest with frames. */
export function pickFeatured(all: Exhibition[]): Exhibition | undefined {
  return (
    all.find((e) => e.data.status === 'current') ??
    [...all].reverse().find((e) => e.data.frames.length > 0)
  );
}

export const frameCount = (e: Exhibition) => `${e.data.frames.length} ${e.data.frames.length === 1 ? 'frame' : 'frames'}`;

export const statusLabel = (e: Exhibition) =>
  ({ current: 'Now showing', past: 'Past', upcoming: 'Upcoming' })[e.data.status];

/** Every frame across all exhibitions, newest first (for the archive). */
export function allFrames(all: Exhibition[]) {
  return all
    .flatMap((exhibition) =>
      exhibition.data.frames.map((frame, index) => ({
        exhibition,
        frame,
        index,
        year: frame.date.getFullYear(),
        url: frameUrl(exhibition.id, index),
      })),
    )
    .sort((a, b) => b.frame.date.getTime() - a.frame.date.getTime());
}
