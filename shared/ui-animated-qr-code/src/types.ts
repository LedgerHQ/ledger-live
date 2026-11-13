import type React from "react";

/**
 * `shimmer`: loading skeleton with a shimmer rippling out from the center, then the code fades in.
 * `copy`: on press, the center badge pops and a ripple of bigger dots runs from the center.
 * `hover`: on press, the dots around the finger grow until it lifts.
 */
export type QrAnimation = "shimmer" | "copy" | "hover";

export type AnimatedQrCodeProps = Readonly<{
  value: string;
  size: number;
  animation: QrAnimation;
  /** Drawn over the clear center, e.g. a CryptoIcon. */
  centerContent?: React.ReactNode;
  /** Called on a tap, for example to copy the value. */
  onPress?: () => void;
  /** Presses the code every 1.6 s by itself, for a steady benchmark load. */
  autoPlay?: boolean;
  testID?: string;
}>;
