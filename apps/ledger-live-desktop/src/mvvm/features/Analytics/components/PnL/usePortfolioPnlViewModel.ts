import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { usePortfolioPnL } from "@ledgerhq/wallet-pnl/hooks";
import { useSelector } from "LLD/hooks/redux";
import { shallowAccountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { buildPortfolioReturnCards } from "LLD/features/PnL/builders/buildPortfolioReturnCards";
import { usePnlViewModelBase } from "LLD/features/PnL/hooks/usePnlViewModelBase";
import type { PnlViewModel } from "LLD/features/PnL/types";

export function usePortfolioPnlViewModel(): PnlViewModel {
  const accounts = useSelector(shallowAccountsSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countervalues = useCountervaluesState();

  const portfolioPnl = usePortfolioPnL(accounts, countervalues, fiatCurrency);

  return usePnlViewModelBase({
    namespace: "pnl.portfolio",
    pnlData: portfolioPnl,
    accountsCount: accounts.length,
    buildCards: ({ unrealisedPnL, realisedPnL, totalPnL, formatFiat, t }) =>
      buildPortfolioReturnCards({
        unrealisedPnL,
        realisedPnL,
        totalPnL,
        formatFiat,
        t,
      }),
  });
}
