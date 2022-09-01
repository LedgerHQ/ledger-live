import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  PostOnboardingActionId,
  PostOnboardingState,
} from "@ledgerhq/types-live";

type ActionCreatorPlain<T = undefined> = () => { type: string; payload: T };
type ActionCreator<T> = (
  arg0: T
) => ReturnType<ActionCreatorPlain<T>> & { payload: T };

export const importPostOnboardingState: ActionCreator<{
  newState: PostOnboardingState;
}> = ({ newState }) => ({
  type: "POST_ONBOARDING_IMPORT_STATE",
  payload: { newState },
});

export const initPostOnboarding: ActionCreator<{
  deviceModelId: DeviceModelId;
  actionsIds: PostOnboardingActionId[];
}> = ({ deviceModelId, actionsIds }) => ({
  type: "POST_ONBOARDING_INIT",
  payload: { deviceModelId, actionsIds },
});

export const setPostOnboardingActionCompleted: ActionCreator<{
  actionId: PostOnboardingActionId;
}> = ({ actionId }) => ({
  type: "POST_ONBOARDING_SET_ACTION_COMPLETED",
  payload: { actionId },
});

export const clearPostOnboardingLastActionCompleted: ActionCreatorPlain =
  () => ({
    type: "POST_ONBOARDING_CLEAR_LAST_ACTION_COMPLETED",
    payload: undefined,
  });

export const hidePostOnboardingWalletEntryPoint: ActionCreatorPlain = () => ({
  type: "POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT",
  payload: undefined,
});
