import { BigNumber } from "bignumber.js";
import { Unit } from "@ledgerhq/types-cryptoassets";
import { ValueChange } from "@ledgerhq/types-live";

export interface BalanceViewProps {
  readonly totalBalance: BigNumber;
  readonly valueChange: ValueChange;
  readonly unit: Unit;
  readonly isAvailable: boolean;
  readonly isFiat: boolean;
  readonly navigateToAnalytics: () => void;
}

export type BalanceViewModelResult = BalanceViewProps;
