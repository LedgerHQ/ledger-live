import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";

const createApyItem = ({
  value,
  type,
  ApyIndicator,
}: {
  value: number;
  type: "NRR" | "APY" | "APR";
  ApyIndicator: React.ComponentType<{ value: number; type: "NRR" | "APY" | "APR" }>;
}) => <ApyIndicator value={value} type={type} />;

export const useLeftApyModule = (
  assets: CryptoOrTokenCurrency[],
  ApyIndicator: React.ComponentType<{ value: number; type: "NRR" | "APY" | "APR" }>,
) => {
  const value = 5.11; // TODO to be retrieved from DADA
  const type = "APY"; // TODO to be retrieved from DADA

  return assets.map(asset => ({
    ...asset,
    leftElement: createApyItem({ value, type, ApyIndicator }),
  }));
};
