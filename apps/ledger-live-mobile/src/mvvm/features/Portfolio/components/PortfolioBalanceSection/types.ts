import { Unit } from "@ledgerhq/types-cryptoassets";
import { ValueChange } from "@ledgerhq/types-live";

export type PortfolioBalanceState = "noSigner" | "noAccounts" | "normal";

export interface PortfolioBalanceSectionProps {
  readonly showAssets: boolean;
  readonly isReadOnlyMode?: boolean;
}

export interface PortfolioBalanceSectionViewProps {
  readonly state: PortfolioBalanceState;
  readonly balance: number;
  readonly countervalueChange: ValueChange;
  readonly unit: Unit;
  readonly isBalanceAvailable: boolean;
  readonly isAnalyticPillVisible: boolean;
  readonly isLoading: boolean;
  readonly shouldDisplayBalanceRefreshRework: boolean;
  /** Remounts AmountDisplay on screen re-focus to recover a frozen animation (LIVE-32169). */
  readonly remountKey: number;
  readonly onToggleDiscreetMode: () => void;
}

export type UsePortfolioBalanceSectionViewModelResult = PortfolioBalanceSectionViewProps;
