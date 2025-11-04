import { useEffect, useRef } from "react";
import { getRemoteConfig } from "@react-native-firebase/remote-config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import { FirebaseRemoteConfigProvider } from "@ledgerhq/live-config/providers/index";
import { firebaseRemoteConfigApi } from "../api/firebaseRemoteConfigApi";

const FETCH_INTERVAL = 5 * 60 * 1000; // 5 minutes

export function useFirebaseRemoteConfig() {
  const rcRef = useRef(getRemoteConfig());

  const [init, initResult] = firebaseRemoteConfigApi.useInitMutation();
  const fetchQuery = firebaseRemoteConfigApi.useFetchAndActivateQuery(rcRef.current, {
    pollingInterval: FETCH_INTERVAL,
    skip: !initResult.isSuccess,
  });

  useEffect(() => {
    LiveConfig.setProvider(
      new FirebaseRemoteConfigProvider({
        getValue: (key: string) => rcRef.current.getValue(key),
      }),
    );
    init(rcRef.current);
  }, [init]);

  const error = initResult.error || fetchQuery.error;
  useEffect(() => {
    if (error) {
      console.error(`Failed to fetch Firebase remote config with error:`, error);
    }
  }, [error]);

  return !initResult.isLoading && (initResult.isError || !fetchQuery.isLoading);
}
