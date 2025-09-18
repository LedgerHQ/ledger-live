import { useEffect } from "react";
import { NativeEventEmitter, NativeModules } from "react-native";
import { DdRum, RumActionType } from "@datadog/mobile-react-native";

const { StartupInfoModule } = NativeModules;

const startupInfoEventEmitter = StartupInfoModule
  ? new NativeEventEmitter(StartupInfoModule)
  : null;

/**
 * Hook to handle native startup information.
 * It retrieves initial startup info and listens for updates.
 * This is useful for tracking application start events in Datadog RUM.
 */
export default function useNativeStartupInfo() {
  useEffect(() => {
    if (StartupInfoModule && startupInfoEventEmitter) {
      // 1. Get initial startup info (for cold start or external warm start)
      StartupInfoModule.getInitialStartupInfo()
        .then((info: Record<string, string | number>) => {
          DdRum.addAction(RumActionType.CUSTOM, "application_start", info);
        })
        .catch((error: string) => {
          console.error("Failed to get initial startup info:", error);
        });

      // 2. Subscribe to subsequent updates (for hot/warm from background)
      const subscription = startupInfoEventEmitter.addListener(
        "NativeStartupInfoUpdate",
        (info: Record<string, string | number>) => {
          DdRum.addAction(RumActionType.CUSTOM, "application_start", info);
        },
      );

      // Clean up the subscription when the component unmounts
      return () => {
        subscription.remove();
      };
    } else {
      console.warn("StartupInfoModule is not available.");
    }
  }, []);
}
