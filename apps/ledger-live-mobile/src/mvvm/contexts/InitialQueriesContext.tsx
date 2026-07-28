import React, { useEffect, useMemo } from "react";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { useGetSupportedFiatsQuery } from "@domain/api-currency-fiat";
import { selectSupportedFiats, selectSupportedFiatsReady } from "@domain/entity-currency-fiat";
import { useDispatch, useSelector } from "~/context/hooks";
import { setCountervalue, setSupportedCounterValues } from "~/actions/settings";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { buildSupportedCounterValues } from "~/logic/buildSupportedCounterValues";
import { counterValueCurrencySelector, counterValueIdOf } from "~/reducers/settings";

export const InitialQueriesContext = React.createContext({
  ofacResult: { blocked: false, isLoading: true },
  firebaseIsReady: false,
  fiatsReady: false,
});

export function InitialQueriesProvider({ children }: React.PropsWithChildren) {
  const dispatch = useDispatch();
  const firebaseIsReady = useSelector(selectRemoteFlagsReady);

  // OFAC Geo Blocking
  const ofacQueryResult = ofacGeoBlockApi.useCheckQuery();
  // Boot-time fiat fetch: onQueryStarted → setFiats populates the supportedFiats slice
  useGetSupportedFiatsQuery();

  const fiatsReady = useSelector(selectSupportedFiatsReady);

  // Keep supportedCounterValues in sync: re-dispatch whenever the slice updates (fallback → CVS result)
  const fiats = useSelector(selectSupportedFiats);
  const counterValueCurrency = useSelector(counterValueCurrencySelector);
  useEffect(() => {
    // Gate on fiatsReady so we act on the authoritative CVS list, not the boot-time
    // fallback — resetting against the fallback would wipe valid but uncommon fiats.
    if (!fiatsReady) return;
    const supportedCounterValues = buildSupportedCounterValues(fiats);
    dispatch(setSupportedCounterValues(supportedCounterValues));

    // Safety net: if the persisted counterValue is no longer supported by CVS, fall back to USD.
    const currentId = counterValueIdOf(counterValueCurrency);
    const isSupported = supportedCounterValues.some(
      ({ currency }) => counterValueIdOf(currency) === currentId,
    );
    if (!isSupported) {
      dispatch(setCountervalue("USD"));
    }
  }, [dispatch, fiats, fiatsReady, counterValueCurrency]);
  const ofacResult = useMemo(
    () => ({ blocked: ofacQueryResult.data ?? false, isLoading: ofacQueryResult.isLoading }),
    [ofacQueryResult.data, ofacQueryResult.isLoading],
  );

  const value = useMemo(
    () => ({ ofacResult, firebaseIsReady, fiatsReady }),
    [ofacResult, firebaseIsReady, fiatsReady],
  );
  return <InitialQueriesContext.Provider value={value}>{children}</InitialQueriesContext.Provider>;
}
