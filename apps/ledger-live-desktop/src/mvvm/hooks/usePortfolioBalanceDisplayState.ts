import { useMemo } from "react";
import { useBalanceSyncState } from "@ledgerhq/live-common/bridge/react/index";
import type { SyncPhase } from "@ledgerhq/live-common/bridge/react/useSyncLifecycle";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { Portfolio, ValueChange } from "@ledgerhq/types-live";
import { usePortfolioBalance } from "LLD/hooks/usePortfolioBalance";

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
  readonly shouldDisplayBalanceRefreshRework: boolean;
}

export function usePortfolioBalanceDisplayState(
  options: UsePortfolioBalanceDisplayStateOptions = {},
): PortfolioBalanceDisplayState {
  const { shouldDisplayBalanceRefreshRework } = useWalletFeaturesConfig("desktop");
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
    shouldFreezeOnSync: shouldDisplayBalanceRefreshRework,
    cvPending: shouldDisplayBalanceRefreshRework ? isCvPending : undefined,
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
      shouldDisplayBalanceRefreshRework,
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
      shouldDisplayBalanceRefreshRework,
    ],
  );
}
