import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ReactNode } from "react";

export const createUseLeftApyModule = ({
  ApyIndicator,
}: {
  ApyIndicator: (args: { value: number; type: "NRR" | "APY" | "APR" }) => ReactNode;
}) => {
  return (assets: CryptoOrTokenCurrency[]) => {
    const value = 5.11; // TODO: fetch DADA
    const type = "APY"; // TODO: fetch DADA

    return assets.map(asset => ({
      ...asset,
      leftElement: ApyIndicator({ value, type }),
    }));
  };
};
