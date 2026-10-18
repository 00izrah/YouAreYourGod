/**
 * The viewing room, progressively enhanced.
 * The page works without this file (real links, real pages). This adds:
 * keyboard stepping, swipe, deep zoom, mobile plaque toggle, and a warm cache for neighbours.
 */
import { initZoom } from './zoom';

const room = document.querySelector<HTMLElement>('[data-room]');

if (room) {
  const { prev, next, first, last } = room.dataset;
  const frameLink = room.querySelector<HTMLAnchorElement>('[data-zoom]');
  const plaque = room.querySelector<HTMLElement>('[data-plaque]');
  const dialog = document.querySelector<HTMLDialogElement>('#zoom');
  const viewer = dialog ? initZoom(dialog) : undefined;

  const go = (url?: string) => {
    if (url && !viewer?.isOpen) location.assign(url);
  };

  const openZoom = () => {
    if (viewer && frameLink) viewer.open(frameLink.href, frameLink.dataset.zoomAlt ?? '');
  };

  // --- Keyboard -----------------------------------------------------------------------------
  document.addEventListener('keydown', (e) => {
    if (e.defaultPrevented || e.metaKey || e.ctrlKey || e.altKey || viewer?.isOpen) return;
    const t = e.target as HTMLElement | null;
    if (t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return;
    switch (e.key) {
      case 'ArrowLeft':
        go(prev);
        break;
      case 'ArrowRight':
        go(next);
        break;
      case 'Home':
        go(first);
        break;
      case 'End':
        go(last);
        break;
      case 'z':
      case 'Z':
        openZoom();
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  // --- Frame click: zoom (desktop) / plaque toggle + double-tap zoom (phones) --------------------
  const phone = () => matchMedia('(pointer: coarse) and (max-width: 40rem)').matches;
  const togglePlaque = () => {
    if (!plaque) return;
    plaque.dataset.expanded = plaque.dataset.expanded === 'true' ? 'false' : 'true';
  };

  let tapTimer = 0;
  frameLink?.addEventListener('click', (e) => {
    if (!viewer) return; // no dialog: fall back to the plain link to the large image
    e.preventDefault();
    if (!phone()) return openZoom();
    if (tapTimer) {
      clearTimeout(tapTimer);
      tapTimer = 0;
      openZoom();
    } else {
      tapTimer = window.setTimeout(() => {
        tapTimer = 0;
        togglePlaque();
      }, 260);
    }
  });
  plaque?.addEventListener('click', () => phone() && togglePlaque());

  // --- Swipe --------------------------------------------------------------------------------
  let start: { x: number; y: number; t: number } | null = null;
  document.addEventListener(
    'touchstart',
    (e) => {
      start = e.touches.length === 1 ? { x: e.touches[0]!.clientX, y: e.touches[0]!.clientY, t: Date.now() } : null;
    },
    { passive: true },
  );
  document.addEventListener(
    'touchend',
    (e) => {
      if (!start || viewer?.isOpen) return;
      const touch = e.changedTouches[0]!;
      const dx = touch.clientX - start.x;
      const dy = touch.clientY - start.y;
      const fast = Date.now() - start.t < 700;
      start = null;
      if (fast && Math.abs(dx) > 56 && Math.abs(dx) > Math.abs(dy) * 1.6) go(dx < 0 ? next : prev);
    },
    { passive: true },
  );

  // --- Warm the cache for neighbouring frames (Chrome also prerenders them via speculation rules) --
  const warm = () => {
    try {
      const urls: string[] = JSON.parse(room.dataset.preload ?? '[]');
      for (const src of urls) new Image().src = src;
    } catch {
      /* ignore */
    }
  };
  if ('requestIdleCallback' in window) requestIdleCallback(warm, { timeout: 3000 });
  else setTimeout(warm, 1500);
}
