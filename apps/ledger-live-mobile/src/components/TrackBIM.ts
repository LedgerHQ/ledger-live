import { useEffect, useCallback, useState } from "react";
import { AppState } from "react-native";
import { isRunningBIMQueue } from "@ledgerhq/hw-transport-react-native-ble";
import { useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { track } from "../analytics";

const TrackBIM = () => {
  const [appState, setAppState] = useState("");
  const bimFeature = useFeature("bim");

  const onAppStateChanged = useCallback(
    nextAppState => {
      if (
        bimFeature?.enabled &&
        appState.match(/inactive|background/) &&
        nextAppState === "active" &&
        isRunningBIMQueue()
      ) {
        track("SuccessfulAppInstallInBackground");
      }
      setAppState(nextAppState);
    },
    [appState, bimFeature],
  );

  useEffect(() => {
    const sub = AppState.addEventListener("change", onAppStateChanged);
    return () => sub.remove();
  }, [onAppStateChanged]);

  return null;
};

export default TrackBIM;
