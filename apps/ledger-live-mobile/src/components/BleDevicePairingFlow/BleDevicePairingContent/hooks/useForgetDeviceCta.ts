import { useCallback } from "react";
import { Linking } from "react-native";
import { track } from "~/analytics";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";

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
  const bleForgetDeviceUrl = useLocalizedUrl(urls.errors.BleForgetDevice);

  const onLearnHowToFixPress = useCallback(() => {
    track("button_clicked", {
      button: BleForgetDeviceDrawerCta.LearnHowToFix,
      source: "MyLedger",
      page: "unpair_required",
    });
    Linking.openURL(bleForgetDeviceUrl);
  }, [bleForgetDeviceUrl]);

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
