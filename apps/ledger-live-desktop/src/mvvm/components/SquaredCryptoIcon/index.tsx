import React from "react";
import { CryptoIcon } from "@ledgerhq/crypto-icons";

export type CryptoIconSize = "16px" | "20px" | "24px" | "32px" | "40px" | "48px" | "56px";

const SIZE_TO_RADIUS: Record<CryptoIconSize, string> = {
  "16px": "4px",
  "20px": "5px",
  "24px": "6px",
  "32px": "8px",
  "40px": "10px",
  "48px": "12px",
  "56px": "14px",
};

type SquaredCryptoIconProps = Omit<Parameters<typeof CryptoIcon>[0], "overridesRadius">;

export const SquaredCryptoIcon = ({ size = "48px", ...props }: SquaredCryptoIconProps) => {
  const radius = SIZE_TO_RADIUS[size];

  return <CryptoIcon size={size} overridesRadius={radius} {...props} />;
};
