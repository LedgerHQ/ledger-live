import { ValueChange } from "@ledgerhq/types-live";

export interface BalanceParts {
  readonly integerPart: string;
  readonly decimalSeparator: string;
  readonly decimalDigits: string;
}

export interface BalanceViewProps {
  readonly balanceParts: BalanceParts;
  readonly valueChange: ValueChange;
  readonly isAvailable: boolean;
  readonly navigateToAnalytics: () => void;
  readonly handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export type BalanceViewModelResult = BalanceViewProps;
