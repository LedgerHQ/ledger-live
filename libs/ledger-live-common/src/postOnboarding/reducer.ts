import { DeviceModelId } from "@ledgerhq/types-devices";
import {
  PostOnboardingActionId,
  PostOnboardingState,
} from "@ledgerhq/types-live";
import { handleActions } from "redux-actions";
import type { ReducerMap } from "redux-actions";

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

export const postOnboardingSelector = ({
  postOnboarding,
}: {
  postOnboarding: PostOnboardingState;
}): PostOnboardingState => postOnboarding;

export const hubStateSelector = ({
  postOnboarding,
}: {
  postOnboarding: PostOnboardingState;
}): {
  deviceModelId: PostOnboardingState["deviceModelId"];
  actionsToComplete: PostOnboardingState["actionsToComplete"];
  actionsCompleted: PostOnboardingState["actionsCompleted"];
  lastActionCompleted: PostOnboardingState["lastActionCompleted"];
} => {
  const {
    deviceModelId,
    actionsToComplete,
    actionsCompleted,
    lastActionCompleted,
  } = postOnboarding;
  return {
    deviceModelId,
    actionsToComplete,
    actionsCompleted,
    lastActionCompleted,
  };
};

export const postOnboardingDeviceModelIdSelector = ({
  postOnboarding,
}: {
  postOnboarding: PostOnboardingState;
}): PostOnboardingState["deviceModelId"] => postOnboarding.deviceModelId;

export const walletPostOnboardingEntryPointDismissedSelector = ({
  postOnboarding,
}: {
  postOnboarding: PostOnboardingState;
}): PostOnboardingState["walletEntryPointDismissed"] =>
  postOnboarding.walletEntryPointDismissed;
