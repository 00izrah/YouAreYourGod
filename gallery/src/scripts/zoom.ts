/**
 * Deep-zoom viewer: wheel / pinch zoom, drag pan, double-click or double-tap to toggle.
 * Works on any <dialog class="zoom"> containing .zoom-stage > img and .zoom-close.
 */
export interface ZoomViewer {
  open(src: string, alt: string): void;
  close(): void;
  readonly isOpen: boolean;
}

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v));

export function initZoom(dialog: HTMLDialogElement): ZoomViewer {
  const stage = dialog.querySelector<HTMLElement>('.zoom-stage')!;
  const img = stage.querySelector<HTMLImageElement>('img')!;
  const closeBtn = dialog.querySelector<HTMLButtonElement>('.zoom-close')!;
  const hint = dialog.querySelector<HTMLElement>('.zoom-hint');

  let natW = 0;
  let natH = 0;
  let scale = 1;
  let fit = 1;
  let x = 0;
  let y = 0;
  let hintTimer = 0;

  const limits = () => ({ min: fit, max: Math.max(fit * 5, 2) });

  function apply() {
    const cw = stage.clientWidth;
    const ch = stage.clientHeight;
    const w = natW * scale;
    const h = natH * scale;
    // Centre when smaller than the stage; otherwise keep the image covering the stage.
    x = w <= cw ? (cw - w) / 2 : clamp(x, cw - w, 0);
    y = h <= ch ? (ch - h) / 2 : clamp(y, ch - h, 0);
    img.style.transform = `translate(${x}px, ${y}px) scale(${scale})`;
  }

  function computeFit() {
    fit = Math.min(stage.clientWidth / natW, stage.clientHeight / natH);
  }

  function reset() {
    computeFit();
    scale = fit;
    x = 0;
    y = 0;
    apply();
  }

  function zoomAt(px: number, py: number, nextScale: number) {
    const { min, max } = limits();
    const s2 = clamp(nextScale, min, max);
    x = px - ((px - x) * s2) / scale;
    y = py - ((py - y) * s2) / scale;
    scale = s2;
    apply();
  }

  function stagePoint(e: { clientX: number; clientY: number }) {
    const r = stage.getBoundingClientRect();
    return { x: e.clientX - r.left, y: e.clientY - r.top };
  }

  function toggleAt(px: number, py: number) {
    const atFit = Math.abs(scale - fit) < 0.001;
    zoomAt(px, py, atFit ? Math.max(fit * 2.5, 1) : fit);
  }

  // --- Pointer handling: one pointer pans, two pinch, quick double tap toggles ---------------
  const pointers = new Map<number, { x: number; y: number }>();
  let pinchStart: { dist: number; scale: number } | null = null;
  let lastTap = { t: 0, x: 0, y: 0 };
  let moved = 0;

  stage.addEventListener('pointerdown', (e) => {
    stage.setPointerCapture(e.pointerId);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY });
    if (pointers.size === 1) moved = 0;
    if (pointers.size === 2) {
      const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
      pinchStart = { dist: Math.hypot(a.x - b.x, a.y - b.y), scale };
    }
    stage.classList.add('is-dragging');
  });

  stage.addEventListener('pointermove', (e) => {
    const prev = pointers.get(e.pointerId);
    if (!prev) return;
    const cur = { x: e.clientX, y: e.clientY };
    pointers.set(e.pointerId, cur);

    if (pointers.size === 1) {
      x += cur.x - prev.x;
      y += cur.y - prev.y;
      moved += Math.abs(cur.x - prev.x) + Math.abs(cur.y - prev.y);
      apply();
    } else if (pointers.size === 2 && pinchStart) {
      const [a, b] = [...pointers.values()] as [{ x: number; y: number }, { x: number; y: number }];
      const dist = Math.hypot(a.x - b.x, a.y - b.y);
      const mid = stagePoint({ clientX: (a.x + b.x) / 2, clientY: (a.y + b.y) / 2 });
      zoomAt(mid.x, mid.y, pinchStart.scale * (dist / pinchStart.dist));
      moved += 10;
    }
  });

  const end = (e: PointerEvent) => {
    if (!pointers.has(e.pointerId)) return;
    const wasSingle = pointers.size === 1;
    pointers.delete(e.pointerId);
    if (pointers.size < 2) pinchStart = null;
    if (pointers.size === 0) stage.classList.remove('is-dragging');

    if (wasSingle && e.type === 'pointerup' && moved < 8) {
      const now = performance.now();
      const p = stagePoint(e);
      if (now - lastTap.t < 320 && Math.hypot(p.x - lastTap.x, p.y - lastTap.y) < 24) {
        toggleAt(p.x, p.y);
        lastTap = { t: 0, x: 0, y: 0 };
      } else {
        lastTap = { t: now, x: p.x, y: p.y };
      }
    }
  };
  stage.addEventListener('pointerup', end);
  stage.addEventListener('pointercancel', end);

  stage.addEventListener(
    'wheel',
    (e) => {
      e.preventDefault();
      const p = stagePoint(e);
      const unit = e.deltaMode === 1 ? 16 : 1;
      zoomAt(p.x, p.y, scale * Math.exp(-e.deltaY * unit * (e.ctrlKey ? 0.01 : 0.0018)));
    },
    { passive: false },
  );

  dialog.addEventListener('keydown', (e) => {
    const cx = stage.clientWidth / 2;
    const cy = stage.clientHeight / 2;
    switch (e.key) {
      case '+':
      case '=':
        zoomAt(cx, cy, scale * 1.4);
        break;
      case '-':
        zoomAt(cx, cy, scale / 1.4);
        break;
      case '0':
        reset();
        break;
      case 'ArrowLeft':
        x += 80;
        apply();
        break;
      case 'ArrowRight':
        x -= 80;
        apply();
        break;
      case 'ArrowUp':
        y += 80;
        apply();
        break;
      case 'ArrowDown':
        y -= 80;
        apply();
        break;
      default:
        return;
    }
    e.preventDefault();
  });

  window.addEventListener('resize', () => {
    if (!dialog.open || !natW) return;
    const wasFit = Math.abs(scale - fit) < 0.001;
    computeFit();
    if (wasFit) scale = fit;
    scale = clamp(scale, limits().min, limits().max);
    apply();
  });

  closeBtn.addEventListener('click', () => dialog.close());
  dialog.addEventListener('close', () => {
    pointers.clear();
    pinchStart = null;
    stage.classList.remove('is-dragging');
    clearTimeout(hintTimer);
  });

  return {
    get isOpen() {
      return dialog.open;
    },
    close: () => dialog.close(),
    open(src, alt) {
      img.alt = alt;
      img.style.visibility = 'hidden';
      dialog.showModal();
      if (hint) {
        hint.style.opacity = '1';
        hintTimer = window.setTimeout(() => (hint.style.opacity = '0'), 3500);
      }
      const ready = () => {
        natW = img.naturalWidth;
        natH = img.naturalHeight;
        img.style.width = `${natW}px`;
        img.style.height = `${natH}px`;
        reset();
        img.style.visibility = 'visible';
      };
      if (img.getAttribute('src') !== src) {
        img.onload = ready;
        img.src = src;
      } else if (img.complete && img.naturalWidth) {
        ready();
      } else {
        img.onload = ready;
      }
    },
  };
}
