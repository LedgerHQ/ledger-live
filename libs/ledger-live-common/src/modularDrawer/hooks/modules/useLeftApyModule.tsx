import React from "react";
import { CryptoOrTokenCurrency } from "@ledgerhq/types-cryptoassets";
import { ApyType } from "../../types";

const createApyItem = ({
  value,
  type,
  ApyIndicator,
}: {
  value: number;
  type: ApyType;
  ApyIndicator: React.ComponentType<{ value: number; type: ApyType }>;
}) => <ApyIndicator value={value} type={type} />;

export const useLeftApyModule = (
  assets: CryptoOrTokenCurrency[],
  ApyIndicator: React.ComponentType<{ value: number; type: ApyType }>,
) => {
  const value = 5.11; // TODO to be retrieved from DADA
  const type = "APY"; // TODO to be retrieved from DADA

  return assets.map(asset => ({
    ...asset,
    leftElement: createApyItem({ value, type, ApyIndicator }),
  }));
};
