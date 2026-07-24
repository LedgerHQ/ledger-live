import { Unit } from "@domain/entity-currency";
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
  readonly onToggleDiscreetMode: () => void;
}

export type UsePortfolioBalanceSectionViewModelResult = PortfolioBalanceSectionViewProps;
