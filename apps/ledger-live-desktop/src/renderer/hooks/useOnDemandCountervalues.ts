import { useEffect, useMemo } from "react";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import type { TrackingPair } from "@ledgerhq/live-countervalues/types";
import { pairId } from "@ledgerhq/live-countervalues/helpers";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import {
  addExtraTrackingPairs,
  selectExtraTrackingPairs,
} from "~/renderer/reducers/countervaluesExtraTracking";

/**
 * Ensures that all given currencies are tracked against `counterValueCurrency`.
 * Batches all missing pairs into a single Redux dispatch to avoid N separate
 * state updates and the render storm they would cause.
 */
export function useOnDemandCurrenciesCountervalues(
  currencies: Currency[],
  counterValueCurrency: Currency,
) {
  const dispatch = useDispatch();
  const extraPairs = useSelector(selectExtraTrackingPairs);

  useEffect(() => {
    const existingIds = new Set(extraPairs.map(tp => pairId(tp)));
    const missing: TrackingPair[] = currencies
      .filter(c => !existingIds.has(pairId({ from: c, to: counterValueCurrency })))
      .map(c => ({ from: c, to: counterValueCurrency, startDate: new Date() }));

    if (missing.length > 0) {
      dispatch(addExtraTrackingPairs(missing));
    }
  }, [currencies, counterValueCurrency, dispatch, extraPairs]);
}

/**
 * Ensures that the given (currency, counterValueCurrency) pair is tracked by
 * the countervalues system.
 *
 * Prefer `useOnDemandCurrenciesCountervalues` when tracking multiple currencies
 * at once to avoid per-currency Redux dispatches.
 */
export function useOnDemandCurrencyCountervalues(
  currency: Currency,
  counterValueCurrency: Currency,
) {
  const currencies = useMemo(() => [currency], [currency]);

  useOnDemandCurrenciesCountervalues(currencies, counterValueCurrency);
}
