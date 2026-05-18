import { useMemo, useState } from "react";
import { useCryptoFiat } from "../../shared/useCryptoFiat";
import { formatAccount, formatPortfolio } from "./format/formatTrader";
import { computeTraderAccount, ZERO_RESULT } from "./model/computeAccount";
import {
  computeTraderPortfolio,
  ZERO_PORTFOLIO_TOTALS,
  type TraderPortfolioResult,
} from "./model/computePortfolio";
import type { TraderMode } from "./model/types";
import { useMultiAccountsState } from "./state/useMultiAccountsState";
import { useSingleAccountState } from "./state/useSingleAccountState";

const QUOTE_FIAT_TICKER = "USD" as const;
const SINGLE_DEFAULT_ASSET = "ETH" as const;
const MULTI_DEFAULT_ASSETS = ["BTC", "ETH"] as const;

const EMPTY_PORTFOLIO: TraderPortfolioResult = {
  perAccount: new Map(),
  totals: ZERO_PORTFOLIO_TOTALS,
};

export function useTraderViewModel() {
  const fiat = useCryptoFiat(QUOTE_FIAT_TICKER);
  const [mode, setMode] = useState<TraderMode>("single");
  const singleStore = useSingleAccountState(SINGLE_DEFAULT_ASSET);
  const multiStore = useMultiAccountsState(MULTI_DEFAULT_ASSETS);

  const single = useMemo(() => {
    const result = mode === "single" ? computeTraderAccount(singleStore.state) : ZERO_RESULT;
    return {
      ...formatAccount(singleStore.state, result, fiat),
      actions: singleStore.actions,
    };
  }, [mode, singleStore.state, singleStore.actions, fiat]);

  const multi = useMemo(() => {
    const portfolio =
      mode === "multi" ? computeTraderPortfolio(multiStore.accounts) : EMPTY_PORTFOLIO;
    const accounts = multiStore.accounts.map(state =>
      formatAccount(state, portfolio.perAccount.get(state.id) ?? ZERO_RESULT, fiat),
    );
    return {
      accounts,
      canRemove: multiStore.canRemove,
      opsCount: accounts.reduce((acc, a) => acc + a.opsCount, 0),
      totals: formatPortfolio(portfolio, fiat),
      actions: multiStore.actions,
    };
  }, [mode, multiStore.accounts, multiStore.canRemove, multiStore.actions, fiat]);

  return {
    fiatTicker: fiat.ticker,
    mode,
    setMode,
    single,
    multi,
  };
}

export type TraderViewModel = ReturnType<typeof useTraderViewModel>;
export type TraderSingleVM = TraderViewModel["single"];
export type TraderMultiVM = TraderViewModel["multi"];
export type TraderMultiAccountVM = TraderMultiVM["accounts"][number];
