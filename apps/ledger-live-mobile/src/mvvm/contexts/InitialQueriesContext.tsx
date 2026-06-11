import React, { useMemo } from "react";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { useSelector } from "~/context/hooks";
import { selectRemoteFlagsReady } from "@shared/feature-flags";

export const InitialQueriesContext = React.createContext({
  ofacResult: { blocked: false, isLoading: true },
  firebaseIsReady: false,
});

export function InitialQueriesProvider({ children }: React.PropsWithChildren) {
  const firebaseIsReady = useSelector(selectRemoteFlagsReady);

  // OFAC Geo Blocking
  const ofacQueryResult = ofacGeoBlockApi.useCheckQuery();
  const ofacResult = useMemo(
    () => ({ blocked: ofacQueryResult.data ?? false, isLoading: ofacQueryResult.isLoading }),
    [ofacQueryResult.data, ofacQueryResult.isLoading],
  );

  const value = useMemo(() => ({ ofacResult, firebaseIsReady }), [ofacResult, firebaseIsReady]);
  return <InitialQueriesContext.Provider value={value}>{children}</InitialQueriesContext.Provider>;
}
