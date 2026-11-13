import type { ReactNode } from "react";
import type { GlowParams } from "./glowParams";

/** The props contract of Glow, the same on every platform. Glow fills its parent. */
export type GlowProps = Readonly<{
  /** Show the glow at the top edge. A change fades it in or out. Default true. */
  showTop?: boolean;
  /** Show the glow at the bottom edge. A change fades it in or out. Default false. */
  showBottom?: boolean;
  /** Wait before a show change starts, for example while other content fades out. */
  delayMs?: number;
  /** Overrides some of GLOW_DEFAULTS. */
  params?: Partial<GlowParams>;
  /** Shown when the GPU effect cannot run, for example after a shader error. */
  fallback?: ReactNode;
  testID?: string;
}>;
