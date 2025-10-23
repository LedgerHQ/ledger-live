import { useCallback } from "react";
import { Linking } from "react-native";
import { track } from "~/analytics";

const HOW_TO_FORGET_DEVICE_URL =
  "https://support.ledger.com/fr/article/How-to-remove-a-Ledger-device-from-your-phone-s-Bluetooth-settings";

enum BleForgetDeviceDrawerCta {
  LearnHowToFix = "LearnHowToFix",
  TryAgain = "TryAgain",
}

type UseForgetDeviceCtaProps = {
  onRetry: () => void;
};

/**
 * Hook to handle navigation actions in forgetting BLE device drawer.
 */
export function useForgetDeviceCta({ onRetry }: UseForgetDeviceCtaProps) {
  const onLearnHowToFixPress = useCallback(() => {
    track("button_clicked", {
      button: BleForgetDeviceDrawerCta.LearnHowToFix,
      source: "MyLedger",
      page: "unpair_required",
    });
    Linking.openURL(HOW_TO_FORGET_DEVICE_URL);
  }, []);

  const onRetryPress = useCallback(() => {
    track("button_clicked", {
      button: BleForgetDeviceDrawerCta.TryAgain,
      source: "MyLedger",
      page: "unpair_required",
    });
    onRetry();
  }, [onRetry]);

  return { onLearnHowToFixPress, onRetryPress };
}
