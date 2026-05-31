import { StrictMode } from "react";
import { createRoot } from "react-dom/client";
import { LiquidBlobHero } from "../components/LiquidBlobHero";
import "./hero.css";

createRoot(document.getElementById("liquid-blob-root")!).render(
  <StrictMode>
    <LiquidBlobHero mode="full" />
  </StrictMode>
);
