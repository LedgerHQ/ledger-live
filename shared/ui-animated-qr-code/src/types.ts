import type React from "react";

/**
 * `loading`: a skeleton with a shimmer rippling out from the center, for as long as the value is
 * not known.
 * `copy`: on press, the center badge pops and a ripple of bigger dots runs from the center.
 */
export type QrAnimation = "loading" | "copy";

export type AnimatedQrCodeProps = Readonly<{
  value: string;
  size: number;
  animation: QrAnimation;
  /** Drawn over the clear center, e.g. a CryptoIcon. */
  centerContent?: React.ReactNode;
  /** Called on a tap, for example to copy the value. */
  onPress?: () => void;
  /** Read by screen readers when the code is pressable, e.g. "Copy address". */
  accessibilityLabel?: string;
  /** Plays the press animation each time it changes, e.g. from a separate copy button. */
  triggerKey?: number;
  testID?: string;
}>;
