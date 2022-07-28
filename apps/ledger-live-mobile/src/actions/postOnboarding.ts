import { DeviceModelId } from "@ledgerhq/devices/lib/index";
import {
  PostOnboardingActionId,
  PostOnboardingState,
} from "../logic/postOnboarding/types";

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

export const setPostOnboardingActionDone = (
  actionId: PostOnboardingActionId,
) => ({
  type: "POST_ONBOARDING_SET_ACTION_DONE",
  actionId,
});

export const hidePostOnboardingWalletEntryPoint = () => ({
  type: "POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT",
});
