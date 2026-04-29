import React from "react";
import type { DistributionItem } from "@ledgerhq/types-live";
import { CryptoBalanceText } from "../CryptoBalanceText";
import { TotalBalanceView } from "./TotalBalanceView";
import { useTotalBalanceViewModel } from "./useTotalBalanceViewModel";

type TotalBalanceProps = {
  readonly distributionItem: DistributionItem;
};

export function TotalBalance({ distributionItem }: TotalBalanceProps) {
  const viewModel = useTotalBalanceViewModel(distributionItem);

  return (
    <TotalBalanceView
      totalBalanceLabel={viewModel.totalBalanceLabel}
      fiatDisplayValue={viewModel.fiatDisplayValue}
      fiatFormatter={viewModel.fiatFormatter}
      hidden={viewModel.hidden}
      cryptoBalance={
        <CryptoBalanceText amount={viewModel.amount} cryptoUnit={viewModel.cryptoUnit} />
      }
    />
  );
}
