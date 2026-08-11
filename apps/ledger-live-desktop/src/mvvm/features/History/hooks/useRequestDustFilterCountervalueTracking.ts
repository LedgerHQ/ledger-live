import { useEffect } from "react";
import { SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY } from "@ledgerhq/live-common/hideSmallValueTokenOperations/smallValueOperationsThreshold";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { addExtraTrackingPairs } from "~/renderer/reducers/countervaluesExtraTracking";
import { historyDustFilterCounterValueCurrencyForDisplaySelector } from "~/renderer/reducers/history";

/**
 * Ensures the countervalues engine tracks the USD -> counter-value rate used to
 * convert the dust threshold. Without it, `calculate(USD -> counter)` returns
 * undefined for non-USD counter-value currencies, the threshold resolves to
 * null and dust filtering silently no-ops.
 *
 * Must run on every screen that applies the dust filter (global History and
 * Asset Detail transactions/chart), otherwise sub-threshold operations still
 * appear there for non-USD users.
 */
export function useRequestDustFilterCountervalueTracking(): void {
  const dispatch = useDispatch();
  const counterValueCurrency = useSelector(historyDustFilterCounterValueCurrencyForDisplaySelector);

  useEffect(() => {
    if (
      !counterValueCurrency ||
      counterValueCurrency.ticker === SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY.ticker
    ) {
      return;
    }

    dispatch(
      addExtraTrackingPairs([
        {
          from: SMALL_VALUE_OPERATIONS_THRESHOLD_REFERENCE_CURRENCY,
          to: counterValueCurrency,
          startDate: new Date(),
        },
      ]),
    );
  }, [counterValueCurrency, dispatch]);
}
