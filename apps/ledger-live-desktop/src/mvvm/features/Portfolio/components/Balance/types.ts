import { ValueChange } from "@ledgerhq/types-live";
import type { FormattedValue } from "@ledgerhq/lumen-ui-react";

export interface BalanceViewProps {
  readonly balance: number;
  readonly formatter: (value: number) => FormattedValue;
  readonly discreet: boolean;
  readonly valueChange: ValueChange;
  readonly navigateToAnalytics: () => void;
  readonly handleKeyDown: (event: React.KeyboardEvent<HTMLDivElement>) => void;
}

export type BalanceViewModelResult = BalanceViewProps & {
  readonly hasAccount: boolean;
  readonly hasCompletedOnboarding: boolean;
};
