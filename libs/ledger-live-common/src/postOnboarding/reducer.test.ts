import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, PostOnboardingState } from "@ledgerhq/types-live";
import reducer, {
  hubStateSelector,
  initialState,
  postOnboardingDeviceModelIdSelector,
  postOnboardingOnboardingDateSelector,
  postOnboardingSelector,
  walletEntryPointEligibleForPortfolioSelector,
} from "./reducer";

import {
  importPostOnboardingState,
  initPostOnboarding,
  setPostOnboardingActionCompleted,
  clearPostOnboardingLastActionCompleted,
  hidePostOnboardingWalletEntryPoint,
  setPostOnboardingWalletEntryPointEligibility,
  setPostOnboardingDate,
  addPostOnboardingAction,
  removePostOnboardingActionCompleted,
} from "./actions";

const initializationParamsA: Parameters<typeof initPostOnboarding> = [
  {
    deviceModelId: DeviceModelId.nanoX,
    actionsIds: [
      PostOnboardingActionId.claimMock,
      PostOnboardingActionId.migrateAssetsMock,
      PostOnboardingActionId.personalizeMock,
    ],
  },
];

// initialState -> importPostOnboardingState(...initializationParamsA)
const stateA0: PostOnboardingState = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.migrateAssetsMock,
    PostOnboardingActionId.personalizeMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: false,
    [PostOnboardingActionId.migrateAssetsMock]: false,
    [PostOnboardingActionId.personalizeMock]: false,
  },
  lastActionCompleted: null,
  postOnboardingInProgress: true,
};

// stateA0 -> setPostOnboardingActionCompleted(claimMock)
const stateA1: PostOnboardingState = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.migrateAssetsMock,
    PostOnboardingActionId.personalizeMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: true, // stateA0 -> setPostOnboardingActionCompleted(claimMock)
    [PostOnboardingActionId.migrateAssetsMock]: false,
    [PostOnboardingActionId.personalizeMock]: false,
  },
  lastActionCompleted: PostOnboardingActionId.claimMock, // stateA0 -> setPostOnboardingActionCompleted(claimMock)
  postOnboardingInProgress: true,
};

// stateA1 -> clearPostOnboardingLastActionCompleted()
const stateA2: PostOnboardingState = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.migrateAssetsMock,
    PostOnboardingActionId.personalizeMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: true,
    [PostOnboardingActionId.migrateAssetsMock]: false,
    [PostOnboardingActionId.personalizeMock]: false,
  },
  lastActionCompleted: null, // stateA1 -> clearPostOnboardingLastActionCompleted()
  postOnboardingInProgress: true,
};

// stateA2 -> setPostOnboardingActionCompleted(personalizeMock)
const stateA3: PostOnboardingState = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.migrateAssetsMock,
    PostOnboardingActionId.personalizeMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: true,
    [PostOnboardingActionId.migrateAssetsMock]: false,
    [PostOnboardingActionId.personalizeMock]: true, // stateA2 -> setPostOnboardingActionCompleted(personalizeMock)
  },
  lastActionCompleted: PostOnboardingActionId.personalizeMock, // stateA2 -> setPostOnboardingActionCompleted(personalizeMock)
  postOnboardingInProgress: true,
};

// stateA3 -> hidePostOnboardingWalletEntryPoint()
const stateA4: PostOnboardingState = {
  onboardingDate: new Date("2020-01-20").toISOString(), // preserved by hidePostOnboardingWalletEntryPoint()
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: true, // stateA3 -> hidePostOnboardingWalletEntryPoint()
  entryPointFirstDisplayedDate: null,
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.migrateAssetsMock,
    PostOnboardingActionId.personalizeMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: true,
    [PostOnboardingActionId.migrateAssetsMock]: false,
    [PostOnboardingActionId.personalizeMock]: true,
  },
  lastActionCompleted: PostOnboardingActionId.personalizeMock,
  postOnboardingInProgress: true,
};

// stateA0 -> addPostOnboardingAction(recoverMock)
const stateA5: PostOnboardingState = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.migrateAssetsMock,
    PostOnboardingActionId.personalizeMock,
    PostOnboardingActionId.recoverMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: false,
    [PostOnboardingActionId.migrateAssetsMock]: false,
    [PostOnboardingActionId.personalizeMock]: false,
    [PostOnboardingActionId.recoverMock]: false,
  },
  lastActionCompleted: null,
  postOnboardingInProgress: true,
};

// stateA1 -> removePostOnboardingActionCompleted(claimMock)
const stateA6: PostOnboardingState = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.migrateAssetsMock,
    PostOnboardingActionId.personalizeMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: false, // stateA1 -> removePostOnboardingActionCompleted(claimMock)
    [PostOnboardingActionId.migrateAssetsMock]: false,
    [PostOnboardingActionId.personalizeMock]: false,
  },
  lastActionCompleted: null, // stateA1 -> removePostOnboardingActionCompleted(claimMock)
  postOnboardingInProgress: true,
};

const initializationParamsB: Parameters<typeof initPostOnboarding> = [
  {
    deviceModelId: DeviceModelId.nanoS,
    actionsIds: [PostOnboardingActionId.claimMock],
  },
];

// initialState -> importPostOnboardingState(...initializationParamsB)
const stateB0 = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoS,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [PostOnboardingActionId.claimMock],
  actionsCompleted: { [PostOnboardingActionId.claimMock]: false },
  lastActionCompleted: null,
  postOnboardingInProgress: true,
};

// stateB0 -> setPostOnboardingActionCompleted(claimMock)
const stateB1 = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoS,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [PostOnboardingActionId.claimMock],
  actionsCompleted: { [PostOnboardingActionId.claimMock]: true },
  lastActionCompleted: PostOnboardingActionId.claimMock,
  postOnboardingInProgress: true,
};

const initializationParamsC: Parameters<typeof initPostOnboarding> = [
  {
    deviceModelId: DeviceModelId.nanoSP,
    actionsIds: [],
  },
];

// initialState -> importPostOnboardingState(...initializationParamsC)
const stateC0 = {
  onboardingDate: new Date("2020-01-20").toISOString(),
  deviceModelId: DeviceModelId.nanoSP,
  walletEntryPointDismissed: false,
  entryPointFirstDisplayedDate: new Date("2020-01-20"),
  walletEntryPointEligibleForPortfolio: null,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
  postOnboardingInProgress: true,
};

describe("postOnboarding reducer (& action creators)", () => {
  beforeAll(() => {
    jest.useFakeTimers().setSystemTime(new Date("2020-01-20"));
  });

  afterAll(() => {
    jest.runOnlyPendingTimers();
    jest.useRealTimers();
  });

  let state;
  beforeEach(() => {
    // reset state to initial state;
    state = reducer(undefined, {} as any);
  });

  it("should initialize the state properly", () => {
    expect(state).toEqual(initialState);
  });

  it("should handle importPostOnboardingState", () => {
    state = reducer(state, importPostOnboardingState({ newState: stateA0 }));
    expect(state).toEqual(stateA0);
    state = reducer(state, importPostOnboardingState({ newState: stateA1 }));
    expect(state).toEqual(stateA1);
  });

  it("should handle initPostOnboarding", () => {
    state = reducer(state, initPostOnboarding(...initializationParamsA));
    expect(state).toEqual(stateA0);
  });

  it("should handle addPostOnboardingAction", () => {
    state = stateA0;
    state = reducer(
      state,
      addPostOnboardingAction({
        actionId: PostOnboardingActionId.recoverMock,
      }),
    );
    expect(state).toEqual(stateA5);
  });

  it("should handle setPostOnboardingActionCompleted", () => {
    state = stateA0;
    state = reducer(
      state,
      setPostOnboardingActionCompleted({
        actionId: PostOnboardingActionId.claimMock,
      }),
    );
    expect(state).toEqual(stateA1);
  });

  it("should handle clearPostOnboardingLastActionCompleted", () => {
    state = stateA1;
    state = reducer(state, clearPostOnboardingLastActionCompleted());
    expect(state).toEqual({ ...stateA2 });
  });

  it("should handle removePostOnboardingActionCompleted", () => {
    state = stateA1;
    state = reducer(
      state,
      removePostOnboardingActionCompleted({
        actionId: PostOnboardingActionId.claimMock,
      }),
    );
    expect(state).toEqual({ ...stateA6 });
  });

  it("should handle hidePostOnboardingWalletEntryPoint", () => {
    state = stateA3;
    state = reducer(state, hidePostOnboardingWalletEntryPoint());
    expect(state).toEqual(stateA4);
  });

  it("should handle setPostOnboardingWalletEntryPointEligibility", () => {
    state = stateA0;
    state = reducer(state, setPostOnboardingWalletEntryPointEligibility(true));
    expect(state.walletEntryPointEligibleForPortfolio).toBe(true);

    state = reducer(state, setPostOnboardingWalletEntryPointEligibility(false));
    expect(state.walletEntryPointEligibleForPortfolio).toBe(false);

    const stateBefore = state;
    state = reducer(state, {
      type: "POST_ONBOARDING_SET_WALLET_ENTRY_POINT_ELIGIBILITY",
      // @ts-expect-error - testing with null payload
      payload: null,
    });
    expect(state).toBe(stateBefore);
    expect(state.walletEntryPointEligibleForPortfolio).toBe(false);

    state = reducer(state, {
      type: "POST_ONBOARDING_SET_WALLET_ENTRY_POINT_ELIGIBILITY",
      payload: undefined,
    });
    expect(state).toBe(stateBefore);
    state = reducer(state, {
      type: "POST_ONBOARDING_SET_WALLET_ENTRY_POINT_ELIGIBILITY",
      // @ts-expect-error - testing with string payload
      payload: "true",
    });
    expect(state).toBe(stateBefore);
  });

  it("should set onboardingDate (as an ISO string) on initPostOnboarding", () => {
    state = reducer(state, initPostOnboarding(...initializationParamsA));
    expect(typeof state.onboardingDate).toBe("string");
    expect(state.onboardingDate).toBe(new Date("2020-01-20").toISOString());
  });

  it("should preserve an existing onboardingDate when re-initialized for another device", () => {
    state = reducer(state, initPostOnboarding(...initializationParamsA));
    const firstDate = state.onboardingDate;
    expect(firstDate).toBe(new Date("2020-01-20").toISOString());

    // A later onboarding of a different device must NOT reset the cooldown anchor.
    jest.setSystemTime(new Date("2021-09-09"));
    state = reducer(state, initPostOnboarding(...initializationParamsB));
    expect(state.deviceModelId).toBe(DeviceModelId.nanoS); // the rest of the state did re-init
    expect(state.onboardingDate).toBe(firstDate); // but onboardingDate is preserved

    // Restore the fake clock so later tests that assume 2020-01-20 are unaffected.
    jest.setSystemTime(new Date("2020-01-20"));
  });

  it("should not wipe onboardingDate when hiding the wallet entry point", () => {
    state = stateA3;
    state = reducer(state, hidePostOnboardingWalletEntryPoint());
    expect(state.onboardingDate).toBe(new Date("2020-01-20").toISOString());
  });

  it("should default onboardingDate to null when missing from imported state", () => {
    const { onboardingDate, ...withoutDate } = stateA0;
    state = reducer(state, importPostOnboardingState({ newState: withoutDate }));
    expect(state.onboardingDate).toBe(null);
  });

  it("should round-trip onboardingDate through importPostOnboardingState", () => {
    state = reducer(state, importPostOnboardingState({ newState: stateA0 }));
    expect(state.onboardingDate).toBe(new Date("2020-01-20").toISOString());
  });

  it("should set and reset onboardingDate via setPostOnboardingDate", () => {
    const date = new Date("2021-05-05");
    state = reducer(state, setPostOnboardingDate(date));
    expect(state.onboardingDate).toBe(date.toISOString());

    state = reducer(state, setPostOnboardingDate(null));
    expect(state.onboardingDate).toBe(null);
  });

  it("should ignore a non-Date, non-null payload for setPostOnboardingDate", () => {
    state = reducer(state, setPostOnboardingDate(new Date("2021-05-05")));
    const before = state;
    // @ts-expect-error - testing with an invalid (string) payload
    state = reducer(state, setPostOnboardingDate("2022-06-06"));
    expect(state).toBe(before);
  });

  it("should handle successive actions properly", () => {
    // initializing state with new device & set of actions
    state = reducer(state, initPostOnboarding(...initializationParamsA));
    expect(state).toEqual(stateA0);

    // setting completed for claimMock
    state = reducer(
      state,
      setPostOnboardingActionCompleted({
        actionId: PostOnboardingActionId.claimMock,
      }),
    );
    expect(state).toEqual(stateA1);

    // clearing last completed action
    state = reducer(state, clearPostOnboardingLastActionCompleted());
    expect(state).toEqual(stateA2);

    // setting completed for personalizeMock
    state = reducer(
      state,
      setPostOnboardingActionCompleted({
        actionId: PostOnboardingActionId.personalizeMock,
      }),
    );
    expect(state).toEqual(stateA3);

    // hiding wallet entrypoint
    state = reducer(state, hidePostOnboardingWalletEntryPoint());
    expect(state).toEqual(stateA4);

    // initializing state with new device & set of actions
    state = reducer(state, initPostOnboarding(...initializationParamsB));
    expect(state).toEqual(stateB0);

    // setting completed for claimMock
    state = reducer(
      state,
      setPostOnboardingActionCompleted({
        actionId: PostOnboardingActionId.claimMock,
      }),
    );
    expect(state).toEqual(stateB1);

    // initializing state with new device & set of actions
    state = reducer(state, initPostOnboarding(...initializationParamsC));
    expect(state).toEqual(stateC0);
  });
});

describe("postOnboarding selectors", () => {
  it("should keep valid device ids", () => {
    const stateValidDeviceId: PostOnboardingState = {
      onboardingDate: null,
      deviceModelId: DeviceModelId.nanoX,
      walletEntryPointDismissed: false,
      entryPointFirstDisplayedDate: new Date("2020-01-20"),
      actionsToComplete: [],
      actionsCompleted: {},
      lastActionCompleted: null,
      postOnboardingInProgress: false,
      walletEntryPointEligibleForPortfolio: null,
    };
    const storeState = { postOnboarding: stateValidDeviceId };

    const postOnboarding = postOnboardingSelector(storeState);
    expect(postOnboarding).toEqual(stateValidDeviceId);

    const hubState = hubStateSelector(storeState);
    expect(hubState).toEqual({
      deviceModelId: stateValidDeviceId.deviceModelId,
      actionsToComplete: stateValidDeviceId.actionsToComplete,
      actionsCompleted: stateValidDeviceId.actionsCompleted,
      lastActionCompleted: stateValidDeviceId.lastActionCompleted,
      postOnboardingInProgress: false,
    });

    const deviceModelId = postOnboardingDeviceModelIdSelector(storeState);
    expect(deviceModelId).toEqual(stateValidDeviceId.deviceModelId);
  });

  it('should sanitize "nanoFTS" device ids to "stax"', () => {
    const stateValidDeviceId: PostOnboardingState = {
      onboardingDate: null,
      // @ts-expect-error - testing with "nanoFTS" device id
      deviceModelId: "nanoFTS",
      walletEntryPointDismissed: false,
      entryPointFirstDisplayedDate: new Date("2020-01-20"),
      actionsToComplete: [],
      actionsCompleted: {},
      lastActionCompleted: null,
      postOnboardingInProgress: false,
      walletEntryPointEligibleForPortfolio: null,
    };
    const storeState = { postOnboarding: stateValidDeviceId };

    const postOnboarding = postOnboardingSelector(storeState);
    expect(postOnboarding).toEqual({
      ...stateValidDeviceId,
      deviceModelId: DeviceModelId.stax,
    });

    const hubState = hubStateSelector(storeState);
    expect(hubState).toEqual({
      deviceModelId: DeviceModelId.stax,
      actionsToComplete: stateValidDeviceId.actionsToComplete,
      actionsCompleted: stateValidDeviceId.actionsCompleted,
      lastActionCompleted: stateValidDeviceId.lastActionCompleted,
      postOnboardingInProgress: false,
    });

    const deviceModelId = postOnboardingDeviceModelIdSelector(storeState);
    expect(deviceModelId).toEqual(DeviceModelId.stax);
  });

  it("should return walletEntryPointEligibleForPortfolio from state", () => {
    const storeStateTrue = {
      postOnboarding: {
        ...initialState,
        walletEntryPointEligibleForPortfolio: true,
      },
    };
    expect(walletEntryPointEligibleForPortfolioSelector(storeStateTrue)).toBe(true);

    const storeStateFalse = {
      postOnboarding: {
        ...initialState,
        walletEntryPointEligibleForPortfolio: false,
      },
    };
    expect(walletEntryPointEligibleForPortfolioSelector(storeStateFalse)).toBe(false);

    const storeStateNull = { postOnboarding: initialState };
    expect(walletEntryPointEligibleForPortfolioSelector(storeStateNull)).toBe(null);
  });

  it("should return onboardingDate from state", () => {
    const date = new Date("2021-05-05").toISOString();
    const storeStateWithDate = {
      postOnboarding: { ...initialState, onboardingDate: date },
    };
    expect(postOnboardingOnboardingDateSelector(storeStateWithDate)).toBe(date);

    const storeStateNull = { postOnboarding: initialState };
    expect(postOnboardingOnboardingDateSelector(storeStateNull)).toBe(null);
  });
});
