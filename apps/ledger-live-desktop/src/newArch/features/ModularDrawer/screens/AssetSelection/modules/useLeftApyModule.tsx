import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import ApyIndicator from "../../../components/ApyIndicator";

const createApyItem = ({ value }: { value: number }) => <ApyIndicator value={value} type="APY" />;

export const useLeftApyModule = (assets: CryptoOrTokenCurrency[]) => {
  const apyValue = 5.11; // TODO to be retrieved from DADA

  return assets.map(asset => ({ ...asset, leftElement: createApyItem({ value: apyValue }) }));
};
