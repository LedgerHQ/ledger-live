import { BigNumber } from "bignumber.js";
import { useCountervaluesState } from "@ledgerhq/live-countervalues-react";
import { usePortfolioPnL } from "@ledgerhq/wallet-pnl/hooks";
import { useSelector } from "LLD/hooks/redux";
import { flattenAccountsSelector } from "~/renderer/reducers/accounts";
import { counterValueCurrencySelector } from "~/renderer/reducers/settings";
import { usePnlViewModelBase } from "LLD/features/PnL/hooks/usePnlViewModelBase";
import type { PnlViewModel } from "LLD/features/PnL/types";

const ZERO = new BigNumber(0);

export function usePortfolioPnlViewModel(): PnlViewModel {
  const accounts = useSelector(flattenAccountsSelector);
  const fiatCurrency = useSelector(counterValueCurrencySelector);
  const countervalues = useCountervaluesState();

  const portfolioPnl = usePortfolioPnL(accounts, countervalues, fiatCurrency);
  const { costBasis = ZERO } = portfolioPnl ?? {};

  return usePnlViewModelBase({
    namespace: "pnl.portfolio",
    pnlData: portfolioPnl,
    secondaryCard: {
      id: "costBasis",
      titleKey: "pnl.portfolio.costBasis.title",
      tooltipKey: "pnl.portfolio.costBasis.tooltip",
      value: costBasis,
    },
    accountsCount: accounts.length,
  });
}
