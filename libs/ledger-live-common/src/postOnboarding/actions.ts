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

export const addPostOnboardingAction: ActionCreator<{
  actionId: PostOnboardingActionId;
}> = ({ actionId }) => ({
  type: `${actionTypePrefix}ADD_ACTION`,
  payload: { actionId },
});

export const setPostOnboardingActionCompleted: ActionCreator<{
  actionId: PostOnboardingActionId;
}> = ({ actionId }) => ({
  type: `${actionTypePrefix}SET_ACTION_COMPLETED`,
  payload: { actionId },
});

export const removePostOnboardingActionCompleted: ActionCreator<{
  actionId: PostOnboardingActionId;
}> = ({ actionId }) => ({
  type: `${actionTypePrefix}REMOVE_ACTION_COMPLETED`,
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

export const setPostOnboardingWalletEntryPointEligibility: ActionCreator<boolean> = eligible => ({
  type: `${actionTypePrefix}SET_WALLET_ENTRY_POINT_ELIGIBILITY`,
  payload: eligible,
});

export const postOnboardingSetFinished: ActionCreatorPlain = () => ({
  type: `${actionTypePrefix}SET_FINISHED`,
  payload: undefined,
});

/**
 * Sets (or, with `null`, resets) the persisted onboarding date used as the
 * starting point for the large-screen upsell cooldown. Takes a `Date` object;
 * the reducer serializes it to an ISO 8601 string for storage. Drives the
 * legacy backfill and QA tooling.
 */
export const setPostOnboardingDate: ActionCreator<Date | null> = date => ({
  type: `${actionTypePrefix}SET_ONBOARDING_DATE`,
  payload: date,
});
