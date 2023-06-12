import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, PostOnboardingState } from "@ledgerhq/types-live";

type ActionCreatorPlain<T = undefined> = () => { type: string; payload: T };
type ActionCreator<T> = (arg0: T) => ReturnType<ActionCreatorPlain<T>> & { payload: T };

export const actionTypePrefix = "POST_ONBOARDING_";

export const importPostOnboardingState: ActionCreator<{
  newState: Partial<PostOnboardingState>;
}> = ({ newState }) => ({
  type: `${actionTypePrefix}IMPORT_STATE`,
  payload: { newState },
});

export const initPostOnboarding: ActionCreator<{
  deviceModelId: DeviceModelId;
  actionsIds: PostOnboardingActionId[];
}> = ({ deviceModelId, actionsIds }) => ({
  type: `${actionTypePrefix}INIT`,
  payload: { deviceModelId, actionsIds },
});

export const setPostOnboardingActionCompleted: ActionCreator<{
  actionId: PostOnboardingActionId;
}> = ({ actionId }) => ({
  type: `${actionTypePrefix}SET_ACTION_COMPLETED`,
  payload: { actionId },
});

export const clearPostOnboardingLastActionCompleted: ActionCreatorPlain = () => ({
  type: `${actionTypePrefix}CLEAR_LAST_ACTION_COMPLETED`,
  payload: undefined,
});

export const hidePostOnboardingWalletEntryPoint: ActionCreatorPlain = () => ({
  type: `${actionTypePrefix}HIDE_WALLET_ENTRY_POINT`,
  payload: undefined,
});
