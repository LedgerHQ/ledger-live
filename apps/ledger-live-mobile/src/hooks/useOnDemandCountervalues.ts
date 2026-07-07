import { useEffect, useMemo, useRef } from "react";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useTrackingPairs, addExtraSessionTrackingPair } from "~/actions/general";

// Registers the (currency, counterValueCurrency) pair with the countervalues
// engine when missing, then polls so the debounced settings take effect.
export function useOnDemandCurrencyCountervalues(
  currency: Currency,
  counterValueCurrency: Currency,
) {
  const trackingPairs = useTrackingPairs();
  const { poll } = useCountervaluesPolling();
  const pollRef = useRef(poll);
  pollRef.current = poll;

  const hasTrackingPair = useMemo(
    () => trackingPairs.some(tp => tp.from === currency && tp.to === counterValueCurrency),
    [trackingPairs, currency, counterValueCurrency],
  );

  useEffect(() => {
    if (hasTrackingPair) return;
    addExtraSessionTrackingPair({
      from: currency,
      to: counterValueCurrency,
      startDate: new Date(),
    });
    const t = setTimeout(() => pollRef.current(), 2000);
    return () => clearTimeout(t);
  }, [hasTrackingPair, currency, counterValueCurrency]);
}
