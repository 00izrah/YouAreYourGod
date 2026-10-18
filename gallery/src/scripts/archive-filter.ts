/** Archive filters: progressive enhancement. Without JS, the whole collection is simply shown. */
export {};

const root = document.querySelector<HTMLElement>('[data-filters]');
const items = [...document.querySelectorAll<HTMLElement>('[data-sheet] > li')];
const statusEl = document.querySelector<HTMLElement>('[data-status]');

if (root) {
  const state: Record<string, string> = { exhibition: '', year: '' };

  const apply = () => {
    let shown = 0;
    for (const li of items) {
      const match = Object.entries(state).every(([key, value]) => !value || li.dataset[key] === value);
      li.hidden = !match;
      if (match) shown++;
    }
    if (statusEl) statusEl.textContent = `${shown} of ${items.length} frames`;
  };

  root.addEventListener('click', (e) => {
    const btn = (e.target as HTMLElement).closest<HTMLButtonElement>('button[data-key]');
    if (!btn) return;
    const key = btn.dataset.key!;
    state[key] = btn.dataset.value ?? '';
    root.querySelectorAll<HTMLButtonElement>(`button[data-key="${key}"]`).forEach((b) => {
      b.setAttribute('aria-pressed', String(b === btn));
    });
    apply();
  });

  apply();
}
