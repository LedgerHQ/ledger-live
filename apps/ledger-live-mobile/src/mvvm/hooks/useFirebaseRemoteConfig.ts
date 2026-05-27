import { useEffect, useRef } from "react";
import { getRemoteConfig } from "@react-native-firebase/remote-config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider } from "@ledgerhq/live-config/providers/index";
import { firebaseRemoteConfigApi } from "../api/firebaseRemoteConfigApi";

/**
 * Returns `firebaseIsReady` for the initial-queries boot gate. Setup and
 * polling now happen in `~/firebase/remoteConfig`, driven by the feature-flags
 * middleware; this hook only installs the LiveConfig provider bridge and waits
 * for the module's first-fetch signal via the RTK Query mutation.
 */
export function useFirebaseRemoteConfig() {
  const rcRef = useRef(getRemoteConfig());

  const [init, initResult] = firebaseRemoteConfigApi.useInitMutation();

  useEffect(() => {
    LiveConfig.setProvider(
      new FirebaseRemoteConfigProvider({
        getValue: (key: string) => rcRef.current.getValue(key),
      }),
    );
    init();
  }, [init]);

  useEffect(() => {
    if (initResult.error) {
      console.error("Failed to fetch Firebase remote config with error:", initResult.error);
    }
  }, [initResult.error]);

  return initResult.isSuccess || initResult.isError;
}
