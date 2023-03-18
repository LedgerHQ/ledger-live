import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  PostOnboardingActionId,
  PostOnboardingState,
} from "@ledgerhq/types-live";
import { handleActions } from "redux-actions";
import type { ReducerMap } from "redux-actions";
import { createSelector, Selector } from "reselect";

export const initialState: PostOnboardingState = {
  deviceModelId: null,
  walletEntryPointDismissed: false,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
};

type PartialNewStatePayload = { newState: Partial<PostOnboardingState> };
type InitPayload = {
  deviceModelId: DeviceModelId;
  actionsIds: PostOnboardingActionId[];
};
type SetActionCompletedPayload = {
  actionId: PostOnboardingActionId;
};
export type Payload =
  | undefined
  | PartialNewStatePayload
  | InitPayload
  | SetActionCompletedPayload;

const handlers: ReducerMap<PostOnboardingState, Payload> = {
  POST_ONBOARDING_IMPORT_STATE: (_, { payload }): PostOnboardingState =>
    (payload as PartialNewStatePayload).newState as PostOnboardingState,
  POST_ONBOARDING_INIT: (_, { payload }) => {
    const { deviceModelId, actionsIds } = payload as InitPayload;
    return {
      deviceModelId,
      walletEntryPointDismissed: false,
      actionsToComplete: actionsIds,
      actionsCompleted: Object.fromEntries(actionsIds.map((id) => [id, false])),
      lastActionCompleted: null,
    };
  },
  POST_ONBOARDING_SET_ACTION_COMPLETED: (state, { payload }) => {
    const { actionId } = payload as SetActionCompletedPayload;
    const actionsCompleted = { ...state.actionsCompleted, [actionId]: true };
    return {
      ...state,
      actionsCompleted,
      lastActionCompleted: actionId,
    };
  },
  POST_ONBOARDING_CLEAR_LAST_ACTION_COMPLETED: (state) => ({
    ...state,
    lastActionCompleted: null,
  }),
  POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT: (state) => ({
    ...state,
    walletEntryPointDismissed: true,
  }),
};

export default handleActions<PostOnboardingState, Payload>(
  handlers,
  initialState
);

/**
 * remove this function once we can safely assume no user has a LL holding in
 * storage a ref to the old identifier "nanoFTS" which was changed in this PR
 * https://github.com/LedgerHQ/ledger-live/pull/2144
 * */
function sanitizeDeviceModelId(
  deviceModelId: DeviceModelId | null
): DeviceModelId | null {
  if (deviceModelId === null) return null;
  // Nb workaround to prevent crash for dev/qa that have nanoFTS references.
  // to be removed in a while.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (deviceModelId === "nanoFTS") return DeviceModelId.stax;
  return deviceModelId;
}

export const postOnboardingSelector: Selector<
  { postOnboarding: PostOnboardingState },
  PostOnboardingState
> = createSelector(
  (state) => state.postOnboarding,
  (postOnboarding) => ({
    ...postOnboarding,
    deviceModelId: sanitizeDeviceModelId(postOnboarding.deviceModelId),
  })
);

export const hubStateSelector = createSelector(
  postOnboardingSelector,
  (postOnboarding) => {
    const {
      deviceModelId,
      actionsToComplete,
      actionsCompleted,
      lastActionCompleted,
    } = postOnboarding;
    return {
      deviceModelId: sanitizeDeviceModelId(deviceModelId),
      actionsToComplete,
      actionsCompleted,
      lastActionCompleted,
    };
  }
);

export const postOnboardingDeviceModelIdSelector = createSelector(
  postOnboardingSelector,
  (postOnboarding) => sanitizeDeviceModelId(postOnboarding.deviceModelId)
);

export const walletPostOnboardingEntryPointDismissedSelector = createSelector(
  postOnboardingSelector,
  (postOnboarding) => postOnboarding.walletEntryPointDismissed
);
