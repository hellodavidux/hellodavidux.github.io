# Liquid Blob Hero

Podium-inspired metaball hero animation for the `#intro` section.

## Setup (no build required)

The intro section loads **`assets/hero/liquid-blob-hero.js`** and **`liquid-blob-hero.css`** directly — refresh the page and you should see the animation.

### Optional React build

```bash
npm install
npm run build:hero
```

This overwrites `liquid-blob-hero.js` with a React bundle. Use the vanilla files in git if you prefer zero build step.

## Development

```bash
npm run dev:hero          # Vite dev server
npm run preview:hero      # Opens full-page preview (mode="full")
```

## Customize

Edit **`src/components/LiquidBlobHero.tsx`** for animation timing, blob sizes, and mask behavior.

Edit **`src/hero/main.tsx`** for portfolio overlay settings (images, mode).

| Prop | Description |
|------|-------------|
| `mode` | `"overlay"` (center only) or `"full"` (standalone landing) |
| `collageImages` | Array of image URLs inside the blob |
| `logo`, `navItems`, `headline`, `scrollLabel` | Chrome for `mode="full"` |

Replace `DEFAULT_COLLAGE_IMAGES` with your own assets (local paths under `/images/...` work on GitHub Pages).

## Deploy

Commit the built files under `assets/hero/` after `npm run build:hero`, or add `npm run build` to your CI before deploy.
