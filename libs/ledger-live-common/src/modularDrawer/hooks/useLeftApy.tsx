import type { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import type { ReactNode } from "react";

export type ApyIndicator = (args: { value: number; type: "NRR" | "APY" | "APR" }) => ReactNode;

export const createUseLeftApyModule = ({ ApyIndicator }: { ApyIndicator: ApyIndicator }) => {
  return (assets: CryptoOrTokenCurrency[]) => {
    const value = 5.11; // TODO: fetch DADA
    const type = "APY" as const;

    return assets.map(asset => ({
      ...asset,
      leftElement: ApyIndicator({ value, type }),
    }));
  };
};
