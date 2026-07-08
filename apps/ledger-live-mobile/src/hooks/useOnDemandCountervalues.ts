import { useEffect, useRef } from "react";
import type { Currency } from "@ledgerhq/types-cryptoassets";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { useTrackingPairs, addExtraSessionTrackingPair } from "~/actions/general";

export function useOnDemandCurrencyCountervalues(
  currency: Currency,
  counterValueCurrency: Currency,
) {
  const trackingPairs = useTrackingPairs();
  const { poll } = useCountervaluesPolling();

  // Read via refs so registering the pair (which updates trackingPairs) doesn't
  // re-run the effect and clear the timeout before the poll fires.
  const pollRef = useRef(poll);
  pollRef.current = poll;
  const trackingPairsRef = useRef(trackingPairs);
  trackingPairsRef.current = trackingPairs;

  useEffect(() => {
    const alreadyTracked = trackingPairsRef.current.some(
      tp => tp.from === currency && tp.to === counterValueCurrency,
    );
    if (alreadyTracked) return;
    addExtraSessionTrackingPair({
      from: currency,
      to: counterValueCurrency,
      startDate: new Date(),
    });
    const t = setTimeout(() => pollRef.current(), 2000);
    return () => clearTimeout(t);
  }, [currency, counterValueCurrency]);
}
