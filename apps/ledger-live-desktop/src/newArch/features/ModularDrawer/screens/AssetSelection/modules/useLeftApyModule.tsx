import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ApyIndicator } from "@ledgerhq/react-ui/pre-ldls/index";

const createApyItem = ({ value, type }: { value: number; type: "NRR" | "APY" | "APR" }) => (
  <ApyIndicator value={value} type={type} />
);

export const useLeftApyModule = (assets: CryptoOrTokenCurrency[]) => {
  const value = 5.11; // TODO to be retrieved from DADA
  const type = "APY"; // TODO to be retrieved from DADA

  return assets.map(asset => ({ ...asset, leftElement: createApyItem({ value, type }) }));
};
