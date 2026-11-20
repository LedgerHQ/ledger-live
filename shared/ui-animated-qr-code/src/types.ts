import type React from "react";

/**
 * `loading`: a skeleton with a shimmer rippling out from the center, for as long as the value is
 * not known.
 * `ripple`: on press, a ripple of bigger dots runs from the center, and the center content pops.
 */
export type QrAnimation = "loading" | "ripple";

export type AnimatedQrCodeProps = Readonly<{
  value: string;
  size: number;
  animation: QrAnimation;
  /** Drawn over a clear center, e.g. a CryptoIcon. Without it, the code has no hole. */
  centerContent?: React.ReactNode;
  /** Called on a tap, for example to copy the value. */
  onPress?: () => void;
  /** Read by screen readers when the code is pressable, e.g. "Copy address". */
  accessibilityLabel?: string;
  /** Plays the press animation each time it changes, e.g. from a separate button. */
  triggerKey?: number;
  testID?: string;
}>;
