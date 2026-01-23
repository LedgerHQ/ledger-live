import { Unit } from "@ledgerhq/types-cryptoassets";
import { ValueChange } from "@ledgerhq/types-live";

export interface BalanceViewProps {
  readonly totalBalance: number;
  readonly valueChange: ValueChange;
  readonly unit: Unit;
  readonly isAvailable: boolean;
  readonly currencyTicker: string;
}

export type BalanceViewModelResult = BalanceViewProps;
