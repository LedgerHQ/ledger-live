import { useCountervaluesState } from "@features/platform-market-countervalues";
import { useAnalyticsPnlPositions } from "@features/flow-account-analytics";
import { usePortfolioPnL } from "@ledgerhq/wallet-pnl/hooks";
import type { AccountLike } from "@ledgerhq/types-live";
import { useSelector } from "LLD/hooks/redux";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { usePnlViewModelBase } from "LLD/features/PnL/hooks/usePnlViewModelBase";
import { buildPortfolioReturnCards } from "LLD/features/PnL/builders/buildPortfolioReturnCards";
import type { AnalyticsPnlRendererProps } from "./types";

const NO_POSITIONS: AccountLike[] = [];

export function useAnalyticsPnlRendererViewModel({
  scope,
  catalogStatus,
  positions,
}: AnalyticsPnlRendererProps) {
  const countervalues = useCountervaluesState();
  const fiat = useSelector(counterValueCurrencySelector);
  const { positions: selected, status } = useAnalyticsPnlPositions(
    { scope, catalogStatus },
    positions,
  );
  const portfolioPnl = usePortfolioPnL(selected ?? NO_POSITIONS, countervalues, fiat);
  const viewModel = usePnlViewModelBase({
    namespace: "pnl.portfolio",
    pnlData: selected ? portfolioPnl : null,
    accountsCount: selected?.length ?? 0,
    buildCards: ({ unrealisedPnL, realisedPnL, totalPnL, formatFiat, t }) =>
      buildPortfolioReturnCards({ unrealisedPnL, realisedPnL, totalPnL, formatFiat, t }),
  });
  return { viewModel, status };
}
