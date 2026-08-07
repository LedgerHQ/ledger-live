import type React from "react";

export type AddressQrCodeProps = Readonly<{
  value: string;
  size?: number;
  centerContent?: React.ReactNode;
  testID?: string;
}>;
