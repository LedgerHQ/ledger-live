import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import {
  PostOnboardingActionId,
  PostOnboardingState,
} from "@ledgerhq/live-common/lib/postOnboarding/types";

export const importPostOnboardingState = (state: PostOnboardingState) => ({
  type: "POST_ONBOARDING_IMPORT_STATE",
  newState: state,
});

export const initPostOnboarding = (
  deviceModelId: DeviceModelId,
  actionsIds: PostOnboardingActionId[],
) => ({
  type: "POST_ONBOARDING_INIT",
  deviceModelId,
  actionsIds,
});

export const setPostOnboardingActionCompleted = (
  actionId: PostOnboardingActionId,
) => ({
  type: "POST_ONBOARDING_SET_ACTION_COMPLETED",
  actionId,
});

export const clearPostOnboardingLastActionCompleted = () => ({
  type: "POST_ONBOARDING_CLEAR_LAST_ACTION_COMPLETED",
});

export const hidePostOnboardingWalletEntryPoint = () => ({
  type: "POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT",
});
