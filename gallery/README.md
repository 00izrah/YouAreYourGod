# Gallery

Clean, minimal photography gallery built with Astro and Swiper.js.

## Features
- **Horizontal Swiper**: Smooth horizontal movement with mousewheel, trackpad, arrow keys, and touch swipe.
- **Peeking Frames**: The active photograph is centered at full opacity while neighbouring frames peek in dimly on the sides.
- **Dynamic Ambient Gradient**: Samples tones from the current photograph onto an offscreen canvas and smoothly transitions CSS `--grad-primary` and `--grad-secondary` background radial gradients.
- **Zero Upload Friction**: Automatically imports all images in `src/assets/` (`import.meta.glob`). Just drop images in and they appear immediately in the gallery track.

## Getting Started

```sh
npm install
npm run dev        # http://localhost:4321
npm run build      # type-check + static build
npm run preview
```
