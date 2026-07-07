import React, { useEffect, useMemo } from "react";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { useGetSupportedFiatsQuery } from "@domain/api-currency-fiat";
import { selectSupportedFiats } from "@domain/entity-currency-fiat";
import { useDispatch, useSelector } from "~/context/hooks";
import { setSupportedCounterValues } from "~/actions/settings";
import { selectRemoteFlagsReady } from "@shared/feature-flags";
import { buildSupportedCounterValues } from "~/logic/buildSupportedCounterValues";

export const InitialQueriesContext = React.createContext({
  ofacResult: { blocked: false, isLoading: true },
  firebaseIsReady: false,
});

export function InitialQueriesProvider({ children }: React.PropsWithChildren) {
  const dispatch = useDispatch();
  const firebaseIsReady = useSelector(selectRemoteFlagsReady);

  // OFAC Geo Blocking
  const ofacQueryResult = ofacGeoBlockApi.useCheckQuery();
  // Boot-time fiat fetch: onQueryStarted → setFiats populates the supportedFiats slice
  useGetSupportedFiatsQuery();

  // Keep supportedCounterValues in sync: re-dispatch whenever the slice updates (fallback → CVS result)
  const fiats = useSelector(selectSupportedFiats);
  useEffect(() => {
    dispatch(setSupportedCounterValues(buildSupportedCounterValues(fiats)));
  }, [dispatch, fiats]);
  const ofacResult = useMemo(
    () => ({ blocked: ofacQueryResult.data ?? false, isLoading: ofacQueryResult.isLoading }),
    [ofacQueryResult.data, ofacQueryResult.isLoading],
  );

  const value = useMemo(() => ({ ofacResult, firebaseIsReady }), [ofacResult, firebaseIsReady]);
  return <InitialQueriesContext.Provider value={value}>{children}</InitialQueriesContext.Provider>;
}
