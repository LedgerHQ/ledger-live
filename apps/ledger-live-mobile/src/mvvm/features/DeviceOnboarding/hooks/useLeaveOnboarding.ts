import { useNavigation, type NavigationProp, type ParamListBase } from "@react-navigation/native";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
} from "@features/platform-device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { useWalletFeaturesConfig } from "@features/platform-feature-flags";
import { useNotificationsPrompt } from "LLM/features/NotificationsPrompt";
import { useDispatch, useSelector } from "~/context/hooks";
import { hasCompletedOnboardingSelector } from "~/reducers/settings";
import { exitActions } from "../utils/exitActions";
import { isCurrentSessionGenuine } from "../utils/genuineSession";
import { firmwareNeedsLegacyFlow } from "../utils/legacyFlow";

type UseLeaveOnboardingInput = {
  device: Device | null;
  navigateOnExit: boolean;
  wasReadOnlyAtEntry: boolean;
};

/**
 * The action the machine runs once, on its final state. A new one each render is fine: the
 * bindings call the latest one, so it reads the current device and navigation.
 */
export function useLeaveOnboarding({
  device,
  navigateOnExit,
  wasReadOnlyAtEntry,
}: UseLeaveOnboardingInput) {
  const navigation = useNavigation<NavigationProp<ParamListBase>>();
  const dispatch = useDispatch();
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const { notifyFlowCompleted } = useNotificationsPrompt();
  const { shouldDisplayMyWallet } = useWalletFeaturesConfig("mobile");

  return (reason: DeviceOnboardingExitReason, context: DeviceOnboardingContext) => {
    if (!navigateOnExit || !device) return;
    const genuine = isCurrentSessionGenuine(context);
    const seeded = context.isOnboarded === true;
    exitActions[reason]({
      navigation,
      dispatch,
      shouldDisplayMyWallet,
      device,
      wasReadOnlyAtEntry,
      isGenuine: genuine,
      deviceWasSeeded: seeded,
      firmwareNeedsLegacyFlow: firmwareNeedsLegacyFlow(context),
      hasCompletedOnboarding,
    });
    if (
      reason === "completed" ||
      (reason === "userQuit" && genuine) ||
      (reason === "legacyFallback" && seeded && genuine)
    ) {
      notifyFlowCompleted("onboarding");
    }
  };
}
