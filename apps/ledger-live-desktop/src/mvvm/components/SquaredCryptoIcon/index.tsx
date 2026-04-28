import React from "react";
import { CryptoIcon, type CryptoIconProps } from "@ledgerhq/crypto-icons";

export type CryptoIconSize = NonNullable<CryptoIconProps["size"]>;

type SquaredCryptoIconProps = Omit<CryptoIconProps, "shape">;

export const SquaredCryptoIcon = ({ size = 48, ...props }: SquaredCryptoIconProps) => {
  return <CryptoIcon size={size} shape="square" {...props} />;
};
