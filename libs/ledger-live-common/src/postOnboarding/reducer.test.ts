import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId, PostOnboardingState } from "@ledgerhq/types-live";
import reducer, {
  hubStateSelector,
  initialState,
  postOnboardingDeviceModelIdSelector,
  postOnboardingSelector,
} from "./reducer";

import {
  importPostOnboardingState,
  initPostOnboarding,
  setPostOnboardingActionCompleted,
  clearPostOnboardingLastActionCompleted,
  hidePostOnboardingWalletEntryPoint,
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
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
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
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
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
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
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
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: false,
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
  deviceModelId: DeviceModelId.nanoX,
  walletEntryPointDismissed: true, // stateA3 -> hidePostOnboardingWalletEntryPoint()
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

const initializationParamsB: Parameters<typeof initPostOnboarding> = [
  {
    deviceModelId: DeviceModelId.nanoS,
    actionsIds: [PostOnboardingActionId.claimMock],
  },
];

// initialState -> importPostOnboardingState(...initializationParamsB)
const stateB0 = {
  deviceModelId: DeviceModelId.nanoS,
  walletEntryPointDismissed: false,
  actionsToComplete: [PostOnboardingActionId.claimMock],
  actionsCompleted: { [PostOnboardingActionId.claimMock]: false },
  lastActionCompleted: null,
  postOnboardingInProgress: true,
};

// stateB0 -> setPostOnboardingActionCompleted(claimMock)
const stateB1 = {
  deviceModelId: DeviceModelId.nanoS,
  walletEntryPointDismissed: false,
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
  deviceModelId: DeviceModelId.nanoSP,
  walletEntryPointDismissed: false,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
  postOnboardingInProgress: true,
};

describe("postOnboarding reducer (& action creators)", () => {
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

  it("it should handle initPostOnboarding", () => {
    state = reducer(state, initPostOnboarding(...initializationParamsA));
    expect(state).toEqual(stateA0);
  });

  it("it should handle setPostOnboardingActionCompleted", () => {
    state = stateA0;
    state = reducer(
      state,
      setPostOnboardingActionCompleted({
        actionId: PostOnboardingActionId.claimMock,
      }),
    );
    expect(state).toEqual(stateA1);
  });

  it("it should handle clearPostOnboardingLastActionCompleted", () => {
    state = stateA1;
    state = reducer(state, clearPostOnboardingLastActionCompleted());
    expect(state).toEqual({ ...stateA2 });
  });

  it("it should handle hidePostOnboardingWalletEntryPoint", () => {
    state = stateA3;
    state = reducer(state, hidePostOnboardingWalletEntryPoint());
    expect(state).toEqual(stateA4);
  });

  it("it should handle successive actions properly", () => {
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
    const stateValidDeviceId = {
      deviceModelId: DeviceModelId.nanoX,
      walletEntryPointDismissed: false,
      actionsToComplete: [],
      actionsCompleted: {},
      lastActionCompleted: null,
      postOnboardingInProgress: false,
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
    const stateValidDeviceId = {
      deviceModelId: "nanoFTS",
      walletEntryPointDismissed: false,
      actionsToComplete: [],
      actionsCompleted: {},
      lastActionCompleted: null,
      postOnboardingInProgress: false,
    } as unknown as PostOnboardingState;
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
});
