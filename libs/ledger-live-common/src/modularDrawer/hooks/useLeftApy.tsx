import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ReactNode } from "react";
import { ApyType } from "../utils/type";

export const createUseLeftApyModule = ({
  ApyIndicator,
}: {
  ApyIndicator: (args: { value: number; type: ApyType }) => ReactNode;
}) => {
  return (assets: CryptoOrTokenCurrency[]) => {
    const value = 5.11; // TODO: fetch DADA
    const type: ApyType = "APY"; // TODO: fetch DADA

    return assets.map(asset => ({
      ...asset,
      leftElement: ApyIndicator({ value, type }),
    }));
  };
};
