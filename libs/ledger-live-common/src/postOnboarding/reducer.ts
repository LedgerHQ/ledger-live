import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, PostOnboardingState } from "@ledgerhq/types-live";
import { handleActions } from "redux-actions";
import type { ReducerMap } from "redux-actions";
import { createSelector, Selector } from "reselect";

export const initialState: PostOnboardingState = {
  deviceModelId: null,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: null,
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
  postOnboardingInProgress: false,
  onboardingDate: null,
};

type PartialNewStatePayload = { newState: Partial<PostOnboardingState> };
type InitPayload = {
  deviceModelId: DeviceModelId;
  actionsIds: PostOnboardingActionId[];
};
type AddPayload = {
  actionId: PostOnboardingActionId;
};
type SetActionCompletedPayload = {
  actionId: PostOnboardingActionId;
};
type SetOnboardingDatePayload = {
  onboardingDate: Date | string | null;
};

export type Payload =
  | undefined
  | PartialNewStatePayload
  | InitPayload
  | SetActionCompletedPayload
  | SetOnboardingDatePayload
  | AddPayload
  | boolean;

const handlers: ReducerMap<PostOnboardingState, Payload> = {
  POST_ONBOARDING_IMPORT_STATE: (_, { payload }): PostOnboardingState => {
    const { newState } = payload as PartialNewStatePayload;
    return {
      ...initialState,
      ...newState,
      onboardingDate: normalizeOnboardingDate(newState.onboardingDate),
    };
  },
  POST_ONBOARDING_INIT: (state, { payload }) => {
    const { deviceModelId, actionsIds } = payload as InitPayload;
    const isSameDeviceModel = sanitizeDeviceModelId(state.deviceModelId) === deviceModelId;
    const currentOnboardingDate = normalizeOnboardingDate(state.onboardingDate);
    return {
      deviceModelId,
      walletEntryPointDismissed: false,
      entryPointFirstDisplayedDate: new Date(),
      walletEntryPointEligibleForPortfolio: null,
      actionsToComplete: actionsIds,
      actionsCompleted: Object.fromEntries(actionsIds.map(id => [id, false])),
      lastActionCompleted: null,
      postOnboardingInProgress: true,
      onboardingDate:
        isSameDeviceModel && currentOnboardingDate
          ? currentOnboardingDate
          : new Date().toISOString(),
    };
  },
  POST_ONBOARDING_ADD_ACTION: (state, { payload }) => {
    const { actionId } = payload as AddPayload;
    const hasAction = state.actionsToComplete.includes(actionId);
    const actionsToComplete = hasAction
      ? state.actionsToComplete
      : [...state.actionsToComplete, actionId];
    const actionsCompleted = hasAction
      ? state.actionsCompleted
      : {
          ...state.actionsCompleted,
          [actionId]: state.actionsCompleted[actionId] ?? false,
        };
    return {
      ...state,
      actionsToComplete,
      actionsCompleted,
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
  POST_ONBOARDING_REMOVE_ACTION_COMPLETED: (state, { payload }) => {
    const { actionId } = payload as SetActionCompletedPayload;
    const actionsCompleted = { ...state.actionsCompleted, [actionId]: false };
    const lastActionCompleted =
      state.lastActionCompleted === actionId ? null : state.lastActionCompleted;
    return {
      ...state,
      actionsCompleted,
      lastActionCompleted,
    };
  },
  POST_ONBOARDING_CLEAR_LAST_ACTION_COMPLETED: state => ({
    ...state,
    lastActionCompleted: null,
  }),
  POST_ONBOARDING_HIDE_WALLET_ENTRY_POINT: state => ({
    ...state,
    walletEntryPointDismissed: true,
    entryPointFirstDisplayedDate: null,
  }),

  POST_ONBOARDING_SET_WALLET_ENTRY_POINT_ELIGIBILITY: (state, { payload }) => {
    if (typeof payload !== "boolean") return state;
    return {
      ...state,
      walletEntryPointEligibleForPortfolio: payload,
    };
  },

  POST_ONBOARDING_SET_FINISHED: state => ({
    ...state,
    postOnboardingInProgress: false,
  }),

  POST_ONBOARDING_SET_ONBOARDING_DATE: (state, { payload }) => {
    const { onboardingDate } = payload as SetOnboardingDatePayload;
    return {
      ...state,
      onboardingDate: normalizeOnboardingDate(onboardingDate),
    };
  },
};

export default handleActions<PostOnboardingState, Payload>(handlers, initialState);

/**
 * remove this function once we can safely assume no user has a LL holding in
 * storage a ref to the old identifier "nanoFTS" which was changed in this PR
 * https://github.com/LedgerHQ/ledger-live/pull/2144
 * */
function sanitizeDeviceModelId(deviceModelId: DeviceModelId | null): DeviceModelId | null {
  if (deviceModelId === null) return null;
  // Nb workaround to prevent crash for dev/qa that have nanoFTS references.
  // to be removed in a while.
  // eslint-disable-next-line @typescript-eslint/ban-ts-comment
  // @ts-ignore
  if (deviceModelId === "nanoFTS") return DeviceModelId.stax;
  return deviceModelId;
}

function normalizeOnboardingDate(onboardingDate: Date | string | null | undefined): string | null {
  if (onboardingDate == null) return null;
  const date = onboardingDate instanceof Date ? onboardingDate : new Date(onboardingDate);
  return Number.isNaN(date.getTime()) ? null : date.toISOString();
}

function parseOnboardingDate(onboardingDate: Date | string | null | undefined): Date | null {
  const normalizedOnboardingDate = normalizeOnboardingDate(onboardingDate);
  return normalizedOnboardingDate ? new Date(normalizedOnboardingDate) : null;
}

export const postOnboardingSelector: Selector<
  { postOnboarding: PostOnboardingState },
  PostOnboardingState
> = createSelector(
  (state: { postOnboarding: PostOnboardingState }) => state.postOnboarding,
  postOnboarding => ({
    ...postOnboarding,
    deviceModelId: sanitizeDeviceModelId(postOnboarding.deviceModelId),
  }),
);

export const hubStateSelector = createSelector(postOnboardingSelector, postOnboarding => {
  const {
    deviceModelId,
    actionsToComplete,
    actionsCompleted,
    lastActionCompleted,
    postOnboardingInProgress,
  } = postOnboarding;
  return {
    deviceModelId: sanitizeDeviceModelId(deviceModelId),
    actionsToComplete,
    actionsCompleted,
    lastActionCompleted,
    postOnboardingInProgress,
  };
});

export const postOnboardingDeviceModelIdSelector = createSelector(
  postOnboardingSelector,
  postOnboarding => sanitizeDeviceModelId(postOnboarding.deviceModelId),
);

export const walletPostOnboardingEntryPointDismissedSelector = createSelector(
  postOnboardingSelector,
  postOnboarding => postOnboarding.walletEntryPointDismissed,
);

export const entryPointFirstDisplayedDateSelector = createSelector(
  postOnboardingSelector,
  postOnboarding => postOnboarding.entryPointFirstDisplayedDate,
);

export const walletEntryPointEligibleForPortfolioSelector = createSelector(
  postOnboardingSelector,
  postOnboarding => postOnboarding.walletEntryPointEligibleForPortfolio,
);

export const onboardingDateSelector = createSelector(
  (state: { postOnboarding: PostOnboardingState }) => state.postOnboarding.onboardingDate,
  onboardingDate => parseOnboardingDate(onboardingDate),
);
