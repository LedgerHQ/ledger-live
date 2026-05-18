import { BigNumber } from "bignumber.js";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { useAssetGroupPnL } from "@ledgerhq/wallet-pnl/hooks";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { usePnlViewModelBase } from "LLD/features/PnL/hooks/usePnlViewModelBase";
import type { PnlViewModel } from "LLD/features/PnL/types";

const ZERO = new BigNumber(0);

type Props = {
  distributionItem: DistributionItem;
};

export function useAssetPnlViewModel({ distributionItem }: Props): PnlViewModel {
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countervalues = useCountervaluesState();

  const groupPnl = useAssetGroupPnL(distributionItem.accounts, countervalues, fiatCurrency);
  const { averageEntryPrice = ZERO } = groupPnl ?? {};

  return usePnlViewModelBase({
    namespace: "pnl.asset",
    pnlData: groupPnl,
    secondaryCard: {
      id: "averageEntryPrice",
      titleKey: "pnl.asset.entry.title",
      tooltipKey: "pnl.asset.entry.tooltip",
      value: averageEntryPrice,
    },
    accountsCount: distributionItem.accounts.length,
  });
}
