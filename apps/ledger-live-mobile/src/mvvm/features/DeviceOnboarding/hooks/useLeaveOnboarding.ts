import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import type { DeviceOnboardingExitReason } from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useDispatch } from "~/context/hooks";
import { exitActions, opensNextScreen } from "../utils/exitActions";

type UseLeaveOnboardingInput = {
  device: Device | null;
  navigateOnExit: boolean;
};

/**
 * The action the machine runs once, on its final state. A new one each render is fine: the
 * bindings call the latest one, so it reads the current device and navigation.
 */
export function useLeaveOnboarding({ device, navigateOnExit }: UseLeaveOnboardingInput) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  return (reason: DeviceOnboardingExitReason) => {
    if (!device || !opensNextScreen(reason, navigateOnExit)) return;
    exitActions[reason]({ navigation, dispatch, shouldDisplayMyWallet, device });
  };
}
