import React, { useMemo } from "react";
import { ofacGeoBlockApi } from "@ledgerhq/live-common/api/ofacGeoBlockApi";
import { useFirebaseRemoteConfig } from "../hooks/useFirebaseRemoteConfig";

export const InitialQueriesContext = React.createContext({
  ofacResult: { blocked: false, isLoading: true },
  firebaseIsReady: false,
});

export function InitialQueriesProvider({ children }: React.PropsWithChildren) {
  // Firebase Remote Config
  const firebaseIsReady = useFirebaseRemoteConfig();

  // OFAC Geo Blocking
  const ofacQueryResult = ofacGeoBlockApi.useCheckQuery();
  const ofacResult = useMemo(
    () => ({ blocked: ofacQueryResult.data ?? false, isLoading: ofacQueryResult.isLoading }),
    [ofacQueryResult.data, ofacQueryResult.isLoading],
  );

  const value = useMemo(() => ({ ofacResult, firebaseIsReady }), [ofacResult, firebaseIsReady]);
  return <InitialQueriesContext.Provider value={value}>{children}</InitialQueriesContext.Provider>;
}
