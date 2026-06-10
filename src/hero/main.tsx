import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import {
  LiquidBlobHero,
  DEFAULT_COLLAGE_IMAGES,
} from "../components/LiquidBlobHero";
import "./hero.css";

/** Customize overlay hero, swap images, sizes, or switch to mode="full" */
const HERO_CONFIG = {
  mode: "overlay" as const,
  collageImages: DEFAULT_COLLAGE_IMAGES,
  // collageImages: ["/images/your-photo-1.jpg", "/images/your-photo-2.jpg"],
};

const rootEl = document.getElementById("liquid-blob-root");

if (rootEl) {
  createRoot(rootEl).render(
    <StrictMode>
      <LiquidBlobHero {...HERO_CONFIG} />
    </StrictMode>
  );
}
