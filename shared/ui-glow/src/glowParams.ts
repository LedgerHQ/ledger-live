/** How long a glow takes to fade in or out (ease in and out). Same value in the native views. */
export const GLOW_FADE_MS = 1000;

/** The design knobs of the glow, from the designer's "Onboarding Glow" playground. */
export type GlowParams = Readonly<{
  intensity: number;
  opacity: number;
  grain: number;
  grainSize: number;
  chroma: number;
  softness: number;
  width: number;
  /** Height of the glow. */
  reach: number;
  /** Height of the top glow, as a multiple of `reach`. */
  topReach: number;
  dark: number;
  spreadX: number;
  /** 0 = original lobe layout, 1 = mirrored, evenly weighted lobes. */
  balance: number;
  /** Separates the bright core from its skirt. */
  contrast: number;
}>;

/** "Final glow" tab of the playground, plus a touch of contrast. */
export const GLOW_DEFAULTS: GlowParams = {
  intensity: 0.28,
  opacity: 0.56,
  grain: 0.33,
  grainSize: 1.0,
  chroma: 0.03,
  softness: 1.86,
  width: 0.74,
  reach: 0.16,
  topReach: 1,
  dark: 0.18,
  spreadX: 1,
  balance: 0.72,
  contrast: 0.35,
};

/** Order of the `uP` uniform: the `#define P_*` lines of the shaders. */
export const GLOW_PARAM_ORDER = [
  "intensity",
  "opacity",
  "grain",
  "grainSize",
  "chroma",
  "softness",
  "width",
  "reach",
  "dark",
  "spreadX",
  "balance",
  "contrast",
  "topReach",
] as const satisfies readonly (keyof GlowParams)[];

export function toUniformArray(params: GlowParams): number[] {
  return GLOW_PARAM_ORDER.map(key => params[key]);
}
