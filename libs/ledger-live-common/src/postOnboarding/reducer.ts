import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, PostOnboardingState } from "@ledgerhq/types-live";
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { createSelector, Selector } from "reselect";

export const initialState: PostOnboardingState = {
  deviceModelId: null,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: null,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
  postOnboardingInProgress: false,
};

const postOnboardingSlice = createSlice({
  name: "postOnboarding",
  initialState,
  reducers: {
    importPostOnboardingState: (
      _state,
      action: PayloadAction<{ newState: Partial<PostOnboardingState> }>,
    ): PostOnboardingState => {
      return action.payload.newState as PostOnboardingState;
    },
    initPostOnboarding: (
      _state,
      action: PayloadAction<{
        deviceModelId: DeviceModelId;
        actionsIds: PostOnboardingActionId[];
      }>,
    ) => {
      const { deviceModelId, actionsIds } = action.payload;
      return {
        deviceModelId,
        walletEntryPointDismissed: false,
        entryPointFirstDisplayedDate: new Date(),
        actionsToComplete: actionsIds,
        actionsCompleted: Object.fromEntries(actionsIds.map(id => [id, false])),
        lastActionCompleted: null,
        postOnboardingInProgress: true,
      };
    },
    setPostOnboardingActionCompleted: (
      state,
      action: PayloadAction<{ actionId: PostOnboardingActionId }>,
    ) => {
      state.actionsCompleted[action.payload.actionId] = true;
      state.lastActionCompleted = action.payload.actionId;
    },
    clearPostOnboardingLastActionCompleted: state => {
      state.lastActionCompleted = null;
    },
    hidePostOnboardingWalletEntryPoint: state => {
      state.walletEntryPointDismissed = true;
      state.entryPointFirstDisplayedDate = null;
    },
    postOnboardingSetFinished: state => {
      state.postOnboardingInProgress = false;
    },
  },
});

export const {
  importPostOnboardingState,
  initPostOnboarding,
  setPostOnboardingActionCompleted,
  clearPostOnboardingLastActionCompleted,
  hidePostOnboardingWalletEntryPoint,
  postOnboardingSetFinished,
} = postOnboardingSlice.actions;

export const actionTypePrefix = "postOnboarding/";

export default postOnboardingSlice.reducer;

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
