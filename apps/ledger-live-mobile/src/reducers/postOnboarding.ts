import { DeviceModelId } from "@ledgerhq/devices/lib/";
import {
  PostOnboardingActionId,
  PostOnboardingState,
} from "@ledgerhq/live-common/lib/postOnboarding/types";
import { handleActions } from "redux-actions";

const initialState: PostOnboardingState = {
  deviceModelId: null,
  walletEntryPointVisible: false,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
};

const handlers: Record<
  string,
  (state: PostOnboardingState, action: any) => PostOnboardingState
> = {
  POST_ONBOARDING_IMPORT_STATE: (
    _,
    action: { newState: Record<string, any> },
  ): PostOnboardingState =>
    /**
     * TODO: the state passed as param cannot be trusted to match
     * the PostOnboardingState type.
     * We need to do some type guard before setting it
     * in state or the type checking can't be trusted.
     * */
    action.newState as PostOnboardingState,
  POST_ONBOARDING_INIT: (
    _,
    action: {
      deviceModelId: DeviceModelId;
      actionsIds: PostOnboardingActionId[];
    },
  ) => {
    const { deviceModelId, actionsIds } = action;
    if (actionsIds.length === 0) return initialState;
    return {
      deviceModelId,
      walletEntryPointVisible: true,
      actionsToComplete: actionsIds,
      actionsCompleted: Object.fromEntries(actionsIds.map(id => [id, false])),
      lastActionCompleted: null,
    };
  },
  POST_ONBOARDING_SET_ACTION_DONE: (
    state,
    action: { actionId: PostOnboardingActionId },
  ) => {
    const { actionId } = action;
    const actionsCompleted = { ...state.actionsCompleted, [actionId]: true };
    const allCompleted = state.actionsToComplete.every(
      id => actionsCompleted[id],
    );
    return {
      ...state,
      walletEntryPointVisible: state.walletEntryPointVisible && !allCompleted,
      actionsCompleted,
      lastActionCompleted: actionId,
    };
  },
  POST_ONBOARDING_CLEAR_LAST_ACTION_COMPLETED: state => ({
    ...state,
    lastActionCompleted: null,
  }),
  POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT: state => ({
    ...state,
    walletEntryPointVisible: false,
  }),
};

export default handleActions(handlers, initialState);

export const postOnboardingSelector = ({
  postOnboarding,
}: {
  postOnboarding: PostOnboardingState;
}): PostOnboardingState => postOnboarding;

export const hubStateSelector = ({
  postOnboarding,
}: {
  postOnboarding: PostOnboardingState;
}) => {
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

export const walletPostOnboardingEntryPointVisibleSelector = ({
  postOnboarding,
}: {
  postOnboarding: PostOnboardingState;
}) => postOnboarding.walletEntryPointVisible;
