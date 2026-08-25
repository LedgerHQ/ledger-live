import type { FormattedValue } from "@features/flow-pay-card-details";

export interface CardViewModel {
  readonly balance: number;
  readonly formatCountervalue: (value: number) => FormattedValue;
  readonly balanceLabel: string;
}
