import { useMemo } from "react";
import {
  motion,
  useMotionTemplate,
  useMotionValue,
  useReducedMotion,
  animate,
} from "framer-motion";
import { useEffect } from "react";

/** Default athletic / nature collage — replace with your own URLs */
export const DEFAULT_COLLAGE_IMAGES = [
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?w=800&q=80",
  "https://images.unsplash.com/photo-1469474968028-56623f02e42e?w=800&q=80",
  "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?w=800&q=80",
  "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?w=800&q=80",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=800&q=80",
  "https://images.unsplash.com/photo-1470071459604-3b5ec3a7fe05?w=800&q=80",
] as const;

export type LiquidBlobHeroProps = {
  /** `full` = standalone landing; `overlay` = center blob only (for existing layouts) */
  mode?: "full" | "overlay";
  logo?: string;
  navItems?: string[];
  headline?: string;
  scrollLabel?: string;
  collageImages?: readonly string[];
  className?: string;
};

type BlobConfig = {
  id: string;
  size: number;
  x: [number, number, number];
  y: [number, number, number];
  scale: [number, number, number];
  duration: number;
  delay?: number;
};

const MAIN_BLOB: BlobConfig = {
  id: "main",
  size: 280,
  x: [0, 18, -12],
  y: [0, -22, 14],
  scale: [1, 1.06, 0.96],
  duration: 14,
};

const SATELLITE_BLOBS: BlobConfig[] = [
  {
    id: "sat-1",
    size: 88,
    x: [-120, -95, -130],
    y: [-80, -55, -100],
    scale: [0.9, 1.1, 0.85],
    duration: 11,
    delay: 0.4,
  },
  {
    id: "sat-2",
    size: 64,
    x: [130, 155, 110],
    y: [60, 85, 40],
    scale: [1, 0.88, 1.05],
    duration: 9,
    delay: 1.2,
  },
  {
    id: "sat-3",
    size: 52,
    x: [100, 75, 115],
    y: [-110, -90, -125],
    scale: [0.95, 1.08, 0.92],
    duration: 13,
    delay: 0.8,
  },
  {
    id: "sat-4",
    size: 40,
    x: [-90, -70, -105],
    y: [100, 120, 85],
    scale: [1.05, 0.9, 1],
    duration: 10,
    delay: 1.6,
  },
];

function blobKeyframes(config: BlobConfig, reduced: boolean) {
  if (reduced) {
    return { x: config.x[0], y: config.y[0], scale: 1 };
  }
  return {
    x: config.x,
    y: config.y,
    scale: config.scale,
    transition: {
      duration: config.duration,
      repeat: Infinity,
      repeatType: "mirror" as const,
      ease: "easeInOut" as const,
      delay: config.delay ?? 0,
    },
  };
}

function BlobShape({
  config,
  reduced,
  className = "bg-neutral-900",
}: {
  config: BlobConfig;
  reduced: boolean;
  className?: string;
}) {
  const size = config.size;
  return (
    <motion.div
      className={`absolute rounded-full will-change-transform ${className}`}
      style={{
        width: size,
        height: size,
        left: "50%",
        top: "50%",
        marginLeft: -size / 2,
        marginTop: -size / 2,
      }}
      animate={blobKeyframes(config, reduced)}
    />
  );
}

function CollageLayer({
  images,
  reduced,
}: {
  images: readonly string[];
  reduced: boolean;
}) {
  const strips = useMemo(() => {
    const half = Math.ceil(images.length / 2);
    return [images.slice(0, half), images.slice(half)];
  }, [images]);

  return (
    <motion.div
      className="absolute inset-[-40%] flex gap-2 md:gap-3"
      animate={
        reduced
          ? undefined
          : {
              x: ["-5%", "7%", "-3%"],
              y: ["-7%", "5%", "-4%"],
            }
      }
      transition={
        reduced
          ? undefined
          : {
              duration: 32,
              repeat: Infinity,
              repeatType: "mirror",
              ease: "linear",
            }
      }
    >
      {strips.map((column, colIndex) => (
        <motion.div
          key={colIndex}
          className="flex flex-1 flex-col gap-2 md:gap-3"
          animate={
            reduced
              ? undefined
              : {
                  y: colIndex === 0 ? ["0%", "-20%"] : ["-14%", "8%"],
                }
          }
          transition={
            reduced
              ? undefined
              : {
                  duration: 24 + colIndex * 5,
                  repeat: Infinity,
                  repeatType: "mirror",
                  ease: "easeInOut",
                }
          }
        >
          {[...column, ...column].map((src, i) => (
            <div
              key={`${colIndex}-${i}`}
              className="relative aspect-[3/4] w-full overflow-hidden"
            >
              <img
                src={src}
                alt=""
                className="h-full w-full object-cover saturate-[1.12] contrast-[1.08]"
                loading="lazy"
                decoding="async"
              />
            </div>
          ))}
        </motion.div>
      ))}
    </motion.div>
  );
}

/** Animated CSS mask from metaball centers (percent of stage) */
function useBlobMask(reduced: boolean) {
  const cx = useMotionValue(50);
  const cy = useMotionValue(50);
  const r = useMotionValue(34);

  useEffect(() => {
    if (reduced) return;
    const controls = [
      animate(cx, [50, 54, 47, 50], { duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
      animate(cy, [50, 44, 53, 50], { duration: 14, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
      animate(r, [34, 37, 31, 34], { duration: 10, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
    ];
    return () => controls.forEach((c) => c.stop());
  }, [reduced, cx, cy, r]);

  const s1x = useMotionValue(28);
  const s1y = useMotionValue(32);
  const s2x = useMotionValue(72);
  const s2y = useMotionValue(62);

  useEffect(() => {
    if (reduced) return;
    const c = [
      animate(s1x, [26, 32, 24, 26], { duration: 11, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
      animate(s1y, [30, 38, 28, 30], { duration: 11, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
      animate(s2x, [74, 68, 76, 74], { duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
      animate(s2y, [64, 56, 68, 64], { duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }),
    ];
    return () => c.forEach((x) => x.stop());
  }, [reduced, s1x, s1y, s2x, s2y]);

  const maskImage = useMotionTemplate`
    radial-gradient(circle at ${cx}% ${cy}%, black 0%, black ${r}%, transparent ${r}%),
    radial-gradient(circle at ${s1x}% ${s1y}%, black 0%, black 11%, transparent 18%),
    radial-gradient(circle at ${s2x}% ${s2y}%, black 0%, black 9%, transparent 15%),
    radial-gradient(circle at 78% 28%, black 0%, black 7%, transparent 12%),
    radial-gradient(circle at 22% 72%, black 0%, black 6%, transparent 11%)
  `;

  return maskImage;
}

function BlobStage({
  collageImages,
  isOverlay,
}: {
  collageImages: readonly string[];
  isOverlay: boolean;
}) {
  const reduced = useReducedMotion() ?? false;
  const maskImage = useBlobMask(reduced);
  const gooId = "liquid-blob-goo";

  return (
    <div
      className={`relative flex items-center justify-center ${
        isOverlay
          ? "h-[min(72vw,400px)] w-[min(72vw,400px)] md:h-[min(50vh,500px)] md:w-[min(50vh,500px)]"
          : "h-[min(85vw,480px)] w-[min(85vw,480px)] md:h-[min(58vh,560px)] md:w-[min(58vh,560px)]"
      }`}
      aria-hidden
    >
      <svg className="absolute h-0 w-0" aria-hidden>
        <defs>
          <filter id={gooId} x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="16" result="blur" />
            <feColorMatrix
              in="blur"
              type="matrix"
              values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 24 -11"
              result="goo"
            />
            <feBlend in="SourceGraphic" in2="goo" />
          </filter>
        </defs>
      </svg>

      {/* Ambient soft field */}
      <div
        className="absolute inset-[-15%] rounded-full opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse 60% 55% at 50% 50%, rgba(163,163,163,0.35) 0%, rgba(245,245,245,0.9) 55%, transparent 75%)",
        }}
      />

      {/* Photo collage clipped by living mask */}
      <motion.div
        className="absolute inset-0 overflow-hidden"
        style={{
          maskImage,
          WebkitMaskImage: maskImage,
          maskComposite: "add",
          WebkitMaskComposite: "source-over",
        }}
      >
        <CollageLayer images={collageImages} reduced={reduced} />
      </motion.div>

      {/* Dark liquid silhouette (metaball goo) — subtle depth on edges */}
      <motion.div
        className="pointer-events-none absolute inset-0 opacity-[0.88] mix-blend-multiply"
        style={{ filter: `url(#${gooId})` }}
        animate={reduced ? undefined : { scale: [1, 1.025, 0.985, 1] }}
        transition={
          reduced
            ? undefined
            : { duration: 9, repeat: Infinity, repeatType: "mirror", ease: "easeInOut" }
        }
      >
        <div className="relative h-full w-full">
          <BlobShape config={MAIN_BLOB} reduced={reduced} className="bg-neutral-900" />
          {SATELLITE_BLOBS.map((b) => (
            <BlobShape
              key={b.id}
              config={b}
              reduced={reduced}
              className="bg-neutral-800"
            />
          ))}
        </div>
      </motion.div>

      {/* Outer soft edge — blurred pseudo-metaball halo */}
      <div
        className="pointer-events-none absolute inset-[-8%]"
        style={{
          background:
            "radial-gradient(ellipse 50% 48% at 50% 50%, transparent 35%, rgba(0,0,0,0.06) 62%, transparent 78%)",
          filter: "blur(24px)",
          mixBlendMode: "multiply",
        }}
      />

      {/* Subtle grain for cinematic texture */}
      <div
        className="pointer-events-none absolute inset-0 opacity-[0.04] mix-blend-overlay"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
        }}
      />
    </div>
  );
}

export function LiquidBlobHero({
  mode = "overlay",
  logo = "STUDIO",
  navItems = ["Work", "About", "Contact"],
  headline = "WE CRAFT\nDIGITAL\nEXPERIENCES",
  scrollLabel = "Scroll",
  collageImages = DEFAULT_COLLAGE_IMAGES,
  className = "",
}: LiquidBlobHeroProps) {
  const isOverlay = mode === "overlay";

  if (isOverlay) {
    return (
      <div
        className={`pointer-events-none flex h-full w-full items-center justify-center ${className}`}
      >
        <BlobStage collageImages={collageImages} isOverlay />
      </div>
    );
  }

  const headlineLines = headline.split("\n");

  return (
    <section
      className={`relative flex min-h-screen w-full flex-col bg-white text-black ${className}`}
    >
      <header className="relative z-20 flex items-start justify-between p-6 md:p-10">
        <span className="text-lg font-black tracking-tight md:text-xl">{logo}</span>
        <nav className="flex gap-6 text-[10px] font-medium uppercase tracking-[0.2em] text-neutral-500 md:text-xs">
          {navItems.map((item) => (
            <span key={item} className="cursor-default transition-colors hover:text-black">
              {item}
            </span>
          ))}
        </nav>
      </header>

      <div className="relative z-10 flex flex-1 items-center justify-center px-4">
        <BlobStage collageImages={collageImages} isOverlay={false} />
      </div>

      <footer className="relative z-20 flex items-end justify-between p-6 md:p-10">
        <h1 className="max-w-md text-3xl font-black uppercase leading-[0.95] tracking-tight md:text-5xl lg:text-6xl">
          {headlineLines.map((line, i) => (
            <span key={i} className="block">
              {line}
            </span>
          ))}
        </h1>
        <span className="text-[10px] uppercase tracking-[0.25em] text-neutral-400">
          {scrollLabel}
        </span>
      </footer>
    </section>
  );
}

export default LiquidBlobHero;
