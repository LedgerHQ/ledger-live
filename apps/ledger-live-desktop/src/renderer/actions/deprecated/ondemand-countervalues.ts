import { useMemo, useEffect, useState } from "react";
import { useCountervaluesPolling } from "@ledgerhq/live-countervalues-react";
import { TrackingPair } from "@ledgerhq/live-countervalues/types";
import { BehaviorSubject } from "rxjs";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { useCountervaluesUserSettingsContext } from "@ledgerhq/live-countervalues-react";

// extraSessionTrackingPairsChanges allows on demand tracking pair addition. used on specific parts of our app.
// FIXME this is a temporary solution that would deserve a rework to simplify the requirements

export function useOnDemandCurrencyCountervalues(
  currency: Currency,
  counterValueCurrency: Currency,
) {
  const { trackingPairs } = useCountervaluesUserSettingsContext();
  const cvPolling = useCountervaluesPolling();
  const hasTrackingPair = useMemo(
    () => trackingPairs.some(tp => tp.from === currency && tp.to === counterValueCurrency),
    [counterValueCurrency, currency, trackingPairs],
  );
  useEffect(() => {
    if (!hasTrackingPair) {
      addExtraSessionTrackingPair({
        from: currency,
        to: counterValueCurrency,
        startDate: new Date(),
      });
      const t = setTimeout(cvPolling.poll, 2000); // poll after 2s to ensure debounced CV userSettings are effective after this update
      return () => clearTimeout(t);
    }
  }, [counterValueCurrency, currency, cvPolling, cvPolling.poll, hasTrackingPair, trackingPairs]);
}

const extraSessionTrackingPairsChanges: BehaviorSubject<TrackingPair[]> = new BehaviorSubject(
  [] as TrackingPair[],
);

function addExtraSessionTrackingPair(trackingPair: TrackingPair) {
  const value = extraSessionTrackingPairsChanges.value;
  if (!value.some(tp => tp.from === trackingPair.from && tp.to === trackingPair.to))
    extraSessionTrackingPairsChanges.next(value.concat(trackingPair));
}

export function useExtraSessionTrackingPair() {
  const [extraSessionTrackingPair, setExtraSessionTrackingPair] = useState([] as TrackingPair[]);
  useEffect(() => {
    const sub = extraSessionTrackingPairsChanges.subscribe(setExtraSessionTrackingPair);
    return () => sub && sub.unsubscribe();
  }, []);
  return extraSessionTrackingPair;
}
