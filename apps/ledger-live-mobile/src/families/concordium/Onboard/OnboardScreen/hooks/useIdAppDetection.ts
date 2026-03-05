import { useCallback, useEffect, useState } from "react";
import { Linking, Platform } from "react-native";
import { log } from "@ledgerhq/logs";
import { urls } from "~/utils/urls";

const ID_APP_SCHEME = "concordiumidapp://";

export function useIdAppDetection() {
  const [isInstalled, setIsInstalled] = useState<boolean | null>(null);

  useEffect(() => {
    Linking.canOpenURL(ID_APP_SCHEME)
      .then(setIsInstalled)
      .catch(() => setIsInstalled(false));
  }, []);

  const storeUrl =
    Platform.OS === "ios" ? urls.concordium.idApp.appStore : urls.concordium.idApp.playStore;

  const openIdApp = useCallback(
    (uri: string) => {
      Linking.openURL(uri).catch(error => {
        log("concordium-onboarding", "Failed to open Concordium ID App, redirecting to store", {
          error,
        });
        Linking.openURL(storeUrl).catch(storeError => {
          log("concordium-onboarding", "Failed to open store URL", { error: storeError });
        });
      });
    },
    [storeUrl],
  );

  return { isInstalled, openIdApp, storeUrl };
}
