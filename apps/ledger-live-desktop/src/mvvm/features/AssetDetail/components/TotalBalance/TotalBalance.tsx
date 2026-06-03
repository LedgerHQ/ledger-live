import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { CryptoBalanceText } from "../CryptoBalanceText";
import { TotalBalanceView } from "./TotalBalanceView";
import { useTotalBalanceViewModel } from "./useTotalBalanceViewModel";

type TotalBalanceProps = Readonly<{
  distributionItem: DistributionItem;
}>;

export function TotalBalance({ distributionItem }: TotalBalanceProps) {
  const { amount, cryptoUnit, ...viewProps } = useTotalBalanceViewModel(distributionItem);

  return (
    <TotalBalanceView
      {...viewProps}
      cryptoBalance={<CryptoBalanceText amount={amount} cryptoUnit={cryptoUnit} />}
    />
  );
}
