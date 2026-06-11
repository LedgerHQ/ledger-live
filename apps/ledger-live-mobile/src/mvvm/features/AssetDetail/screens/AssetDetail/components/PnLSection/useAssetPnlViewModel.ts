import { BigNumber } from "bignumber.js";
import { useAssetGroupPnL } from "@ledgerhq/wallet-pnl/hooks";
import type { DistributionItem } from "@ledgerhq/types-live";
import { useSelector } from "~/context/hooks";
import { useCountervaluesState } from "~/reducers/countervalues";
import { counterValueCurrencySelector } from "~/reducers/settings";
import { usePnlViewModelBase } from "LLM/features/Pnl/hooks/usePnlViewModelBase";
import type { PnlViewModel } from "LLM/features/Pnl/types";
import { ASSET_DETAIL_PAGE } from "LLM/features/AssetDetail/const";

const ZERO = new BigNumber(0);
const EMPTY_ACCOUNTS: Parameters<typeof useAssetGroupPnL>[0] = [];

type Props = {
  distributionItem: DistributionItem;
  enabled: boolean;
};

export function useAssetPnlViewModel({ distributionItem, enabled }: Props): PnlViewModel {
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countervalues = useCountervaluesState();

  // Skip the (potentially expensive) per-asset walk when the section is hidden.
  const accounts = enabled ? distributionItem.accounts : EMPTY_ACCOUNTS;
  const groupPnl = useAssetGroupPnL(accounts, countervalues, fiatCurrency);
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
    source: ASSET_DETAIL_PAGE,
  });
}
