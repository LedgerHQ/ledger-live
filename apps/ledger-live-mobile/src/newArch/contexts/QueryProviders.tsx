import React, { useMemo } from "react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useOFACGeoBlockCheck } from "@ledgerhq/live-common/hooks/useOFACGeoBlockCheck";
import { getFeature } from "@ledgerhq/live-common/featureFlags/index";
import { FirebaseFeatureFlagsProvider } from "~/components/FirebaseFeatureFlags";
import { useFirebaseRemoteConfig } from "../hooks/useFirebaseRemoteConfig";

const queryClient = new QueryClient();

export function QueryProviders({ children }: React.PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <InitialQueriesProvider>
        <FirebaseFeatureFlagsProvider getFeature={getFeature}>
          {children}
        </FirebaseFeatureFlagsProvider>
      </InitialQueriesProvider>
    </QueryClientProvider>
  );
}

export const InitialQueriesContext = React.createContext({
  ofacResult: { blocked: false, isLoading: true },
  firebaseIsReady: false,
});

function InitialQueriesProvider({ children }: React.PropsWithChildren) {
  const firebaseIsReady = useFirebaseRemoteConfig();
  const ofacResult = useOFACGeoBlockCheck({
    geoBlockingFeatureFlagKey: "llmOfacGeoBlocking",
    enabled: firebaseIsReady,
  });

  const value = useMemo(() => ({ ofacResult, firebaseIsReady }), [ofacResult, firebaseIsReady]);

  return <InitialQueriesContext.Provider value={value}>{children}</InitialQueriesContext.Provider>;
}
