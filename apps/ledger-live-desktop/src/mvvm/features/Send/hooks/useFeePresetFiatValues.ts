import type { Account, AccountLike } from "@ledgerhq/types-live";
import type { Transaction } from "@ledgerhq/live-common/generated/types";
import type { Currency } from "@domain/entity-currency";
import type { Unit } from "@domain/entity-currency-unit";
import { useCalculateCountervalueCallback } from "@ledgerhq/live-countervalues-react";
import {
  useFeePresetFiatValuesCore,
  type FeeFiatMap,
  type UseFeePresetFiatValuesCoreParams,
} from "@ledgerhq/live-common/flows/send/hooks/useFeePresetFiatValuesCore";
import type { FeePresetOption } from "./useFeePresetOptions";

export type { FeeFiatMap };

type Params = Readonly<
  Omit<UseFeePresetFiatValuesCoreParams, "calculateCountervalue"> & {
    counterValueCurrency: Currency;
    feePresetOptions: readonly FeePresetOption[];
    account: AccountLike;
    parentAccount: Account | null;
    mainAccount: Account;
    transaction: Transaction;
    fiatUnit: Unit;
  }
>;

export function useFeePresetFiatValues({ counterValueCurrency, ...params }: Params): FeeFiatMap {
  const calculateCountervalue = useCalculateCountervalueCallback({ to: counterValueCurrency });
  return useFeePresetFiatValuesCore({ ...params, calculateCountervalue });
}
