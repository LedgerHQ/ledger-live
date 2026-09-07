import type React from "react";

export type QrCodeProps = Readonly<{
  value: string;
  size?: number;
  foregroundColor?: string;
  centerContent?: React.ReactNode;
  testID?: string;
}>;
