import { useCallback, useEffect, useRef } from "react";
import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import type { DeviceOnboardingExitReason } from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useDispatch } from "~/context/hooks";
import { exitActions } from "../utils/exitActions";

type UseLeaveOnboardingInput = {
  device: Device | null;
  showNextScreen: boolean;
};

/** The callback the machine runs once, on its final state. */
export function useLeaveOnboarding({ device, showNextScreen }: UseLeaveOnboardingInput) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  // Read when the machine leaves, not when the actor was created.
  const latest = useRef({ navigation, dispatch, shouldDisplayMyWallet, device, showNextScreen });
  useEffect(() => {
    latest.current = { navigation, dispatch, shouldDisplayMyWallet, device, showNextScreen };
  }, [navigation, dispatch, shouldDisplayMyWallet, device, showNextScreen]);

  return useCallback((reason: DeviceOnboardingExitReason) => {
    const { device, showNextScreen, ...deps } = latest.current;
    if (!showNextScreen || !device) return;
    exitActions[reason]({ ...deps, device });
  }, []);
}
