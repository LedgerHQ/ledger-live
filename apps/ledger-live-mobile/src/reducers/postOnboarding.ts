import { DeviceModelId } from "@ledgerhq/devices/lib/";
import { handleActions } from "redux-actions";
import {
  PostOnboardingActionId,
  PostOnboardingState,
} from "../logic/postOnboarding/types";

export type POState = PostOnboardingState;

const initialState: POState = {
  deviceModelId: null,
  walletEntryPointVisible: false,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
};

const handlers: Record<string, (state: POState, action: any) => POState> = {
  POST_ONBOARDING_IMPORT_STATE: (_, action: { newState: POState }) =>
    action.newState,
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
  POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT: state => ({
    ...state,
    walletEntryPointVisible: false,
  }),
};

export default handleActions(handlers, initialState);

export const postOnboardingSelector = ({
  postOnboarding,
}: {
  postOnboarding: POState;
}): POState => postOnboarding;

export const hubStateSelector = ({
  postOnboarding,
}: {
  postOnboarding: POState;
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
  postOnboarding: POState;
}) => postOnboarding.walletEntryPointVisible;
