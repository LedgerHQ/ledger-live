import { useEffect } from "react";

import {
  Adjust,
  AdjustEventTrackingSuccess,
  AdjustEventTrackingFailure,
  AdjustConfig,
} from "react-native-adjust";
import Config from "react-native-config";
import { useSelector } from "react-redux";
import { analyticsEnabledSelector } from "~/reducers/settings";

export default function AdjustSetup() {
  const analyticsEnabled: boolean = useSelector(analyticsEnabledSelector);

  useEffect(() => {
    const adjustConfig = new AdjustConfig(
      Config.ADJUST_APP_TOKEN as string,
      __DEV__ ? AdjustConfig.EnvironmentSandbox : AdjustConfig.EnvironmentProduction, // @TODO: Change to Production when ready
    );
    adjustConfig.setDelayStart(Math.random() * 7 + 1);
    if (__DEV__) {
      adjustConfig.setLogLevel(AdjustConfig.LogLevelDebug);
    }
    if (Config.DEBUG_ADJUST_LOGS) {
      adjustConfig.setEventTrackingSucceededCallbackListener(
        (eventSuccess: AdjustEventTrackingSuccess) => {
          // Printing all event success properties.
          console.warn("Event tracking succeeded!", eventSuccess);
        },
      );

      adjustConfig.setEventTrackingFailedCallbackListener(
        (eventFailure: AdjustEventTrackingFailure) => {
          // Printing all event failure properties.
          console.error("Event tracking failed!", eventFailure);
        },
      );
    }

    Adjust.create(adjustConfig);

    return () => {
      Adjust.componentWillUnmount();
    };
  }, []);

  useEffect(() => {
    Adjust.setEnabled(analyticsEnabled);
  }, [analyticsEnabled]);

  return null;
}
