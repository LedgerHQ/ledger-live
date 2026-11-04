import { useMemo } from "react";
import { useBalanceSyncState } from "@ledgerhq/live-common/bridge/react/index";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/useSyncLifecycle";
import type { Currency } from "@domain/entity-currency";
import type { Portfolio, ValueChange } from "@ledgerhq/types-live";
import { usePortfolioBalance } from "LLD/hooks/usePortfolioBalance";
import {
  useAccountDataPortfolioHistory,
  useCurrentPortfolioWorth,
} from "LLD/features/Portfolio/hooks/useAccountDataPortfolioHistory";
import { endBalanceHistoryAt } from "LLD/features/Portfolio/utils/balanceHistoryValueChange";

export interface UsePortfolioBalanceDisplayStateOptions {
  readonly legacyRange?: boolean;
}

export interface PortfolioBalanceInfo {
  readonly totalBalance: number;
  readonly isAvailable: boolean;
  readonly valueChange: ValueChange;
}

export interface PortfolioBalanceDisplayState {
  readonly portfolio: Portfolio;
  readonly counterValue: Currency;
  readonly displayedBalance: number;
  readonly balanceAvailable: boolean;
  readonly isLoading: boolean;
  readonly isColdStart: boolean;
  readonly isCvPending: boolean;
  readonly syncPhase: SyncPhase;
  readonly valueChange: ValueChange;
  readonly balanceInfo: PortfolioBalanceInfo;
  readonly accountDataHistory: boolean;
}

export function usePortfolioBalanceDisplayState(
  options: UsePortfolioBalanceDisplayStateOptions = {},
): PortfolioBalanceDisplayState {
  const legacyRange = options.legacyRange ?? false;
  const {
    portfolio: legacyPortfolio,
    counterValue,
    isColdStart,
    balanceAvailable: rawBalanceAvailable,
    syncPhase,
    isCvPending,
  } = usePortfolioBalance({ legacyRange });
  const accountData = useAccountDataPortfolioHistory(legacyRange);
  const currentWorth = useCurrentPortfolioWorth();
  const latestBalanceValue =
    currentWorth ??
    legacyPortfolio.balanceHistory[legacyPortfolio.balanceHistory.length - 1]?.value ??
    0;
  const portfolio = useMemo(() => {
    if (!accountData) return legacyPortfolio;
    const ended = endBalanceHistoryAt(accountData, latestBalanceValue);
    return {
      ...legacyPortfolio,
      balanceHistory: ended.balanceHistory,
      countervalueChange: ended.valueChange,
    };
  }, [accountData, latestBalanceValue, legacyPortfolio]);

  const { balanceAvailable, displayedBalance, isLoading } = useBalanceSyncState({
    rawBalanceAvailable,
    syncPhase,
    latestBalance: latestBalanceValue,
    shouldFreezeOnSync: true,
    cvPending: isCvPending,
  });

  const valueChange = portfolio.countervalueChange;
  const balanceInfo = useMemo(
    () => ({
      totalBalance: displayedBalance,
      isAvailable: balanceAvailable,
      valueChange,
    }),
    [displayedBalance, balanceAvailable, valueChange],
  );

  return useMemo(
    () => ({
      portfolio,
      counterValue,
      displayedBalance,
      balanceAvailable,
      isLoading,
      isColdStart,
      isCvPending,
      syncPhase,
      valueChange,
      balanceInfo,
      accountDataHistory: accountData !== undefined,
    }),
    [
      portfolio,
      counterValue,
      displayedBalance,
      balanceAvailable,
      isLoading,
      isColdStart,
      isCvPending,
      syncPhase,
      valueChange,
      balanceInfo,
      accountData,
    ],
  );
}
