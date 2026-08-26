import { useMemo } from "react";
import { useBalanceSyncState } from "@ledgerhq/live-common/bridge/react/index";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/useSyncLifecycle";
import type { Currency } from "@domain/entity-currency";
import type { Portfolio, ValueChange } from "@ledgerhq/types-live";
import { usePortfolioBalance } from "LLD/hooks/usePortfolioBalance";

export interface UsePortfolioBalanceDisplayStateOptions {
  readonly legacyRange?: boolean;
}

export interface PortfolioBalanceInfo {
  readonly totalBalance: number;
  readonly isAvailable: boolean;
  readonly countervalueComplete: boolean;
  readonly valueChange: ValueChange;
}

export interface PortfolioBalanceDisplayState {
  readonly portfolio: Portfolio;
  readonly counterValue: Currency;
  readonly displayedBalance: number;
  readonly balanceAvailable: boolean;
  readonly countervalueComplete: boolean;
  readonly isLoading: boolean;
  readonly isColdStart: boolean;
  readonly isCvPending: boolean;
  readonly syncPhase: SyncPhase;
  readonly valueChange: ValueChange;
  readonly balanceInfo: PortfolioBalanceInfo;
}

export function usePortfolioBalanceDisplayState(
  options: UsePortfolioBalanceDisplayStateOptions = {},
): PortfolioBalanceDisplayState {
  const {
    portfolio,
    counterValue,
    isColdStart,
    balanceAvailable: rawBalanceAvailable,
    syncPhase,
    isCvPending,
  } = usePortfolioBalance({ legacyRange: options.legacyRange ?? false });

  const latestBalanceValue =
    portfolio.balanceHistory[portfolio.balanceHistory.length - 1]?.value ?? 0;

  const { balanceAvailable, displayedBalance, isLoading } = useBalanceSyncState({
    rawBalanceAvailable,
    syncPhase,
    latestBalance: latestBalanceValue,
    shouldFreezeOnSync: true,
    cvPending: isCvPending,
  });

  const valueChange = portfolio.countervalueChange;
  const countervalueComplete = portfolio.countervalueComplete;
  const balanceInfo = useMemo(
    () => ({
      totalBalance: displayedBalance,
      isAvailable: balanceAvailable,
      countervalueComplete,
      valueChange,
    }),
    [displayedBalance, balanceAvailable, countervalueComplete, valueChange],
  );

  return useMemo(
    () => ({
      portfolio,
      counterValue,
      displayedBalance,
      balanceAvailable,
      countervalueComplete,
      isLoading,
      isColdStart,
      isCvPending,
      syncPhase,
      valueChange,
      balanceInfo,
    }),
    [
      portfolio,
      counterValue,
      displayedBalance,
      balanceAvailable,
      countervalueComplete,
      isLoading,
      isColdStart,
      isCvPending,
      syncPhase,
      valueChange,
      balanceInfo,
    ],
  );
}
