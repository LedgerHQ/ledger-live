import { useFeatureFlags } from "../../featureFlags";
import { hubStateSelector } from "../reducer";
import { usePostOnboardingContext } from "./usePostOnboardingContext";
import { getPostOnboardingAction, mockedFeatureIdToTest } from "../mock";
import { renderHook } from "@testing-library/react-hooks";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { usePostOnboardingHubState } from "./usePostOnboardingHubState";

jest.mock("react-redux", () => ({
  useSelector: val => val(),
}));
jest.mock("../../featureFlags");
jest.mock("./usePostOnboardingContext");
jest.mock("../reducer");

const mockedUseFeatureFlags = jest.mocked(useFeatureFlags);

const mockedGetFeatureWithMockFeatureEnabled = enabled => ({
  isFeature: () => true,
  getFeature: id => {
    if (id === mockedFeatureIdToTest) return { enabled };
    return { enabled: true };
  },
  overrideFeature: () => {},
  resetFeature: () => {},
  resetFeatures: () => {},
});

const mockedUsePostOnboardingContext = jest.mocked(usePostOnboardingContext);

const mockedHubStateSelector = jest.mocked(hubStateSelector);

const defaultHubState = {
  deviceModelId: DeviceModelId.nanoX,
  actionsToComplete: [],
  actionsCompleted: {},
  lastActionCompleted: null,
};

const stateAllCompleted = {
  deviceModelId: DeviceModelId.nanoX,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.personalizeMock,
    PostOnboardingActionId.migrateAssetsMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: true,
    [PostOnboardingActionId.personalizeMock]: true,
    [PostOnboardingActionId.migrateAssetsMock]: true,
  },
  lastActionCompleted: PostOnboardingActionId.personalizeMock,
};

const stateAllNotCompleted = {
  deviceModelId: DeviceModelId.nanoX,
  actionsToComplete: [
    PostOnboardingActionId.claimMock,
    PostOnboardingActionId.personalizeMock,
    PostOnboardingActionId.migrateAssetsMock,
  ],
  actionsCompleted: {
    [PostOnboardingActionId.claimMock]: false,
    [PostOnboardingActionId.personalizeMock]: false,
    [PostOnboardingActionId.migrateAssetsMock]: false,
  },
  lastActionCompleted: null,
};

describe("usePostOnboardingHubState", () => {
  beforeEach(() => {
    mockedUseFeatureFlags.mockReturnValue(mockedGetFeatureWithMockFeatureEnabled(true));
    mockedUsePostOnboardingContext.mockReturnValue({
      getPostOnboardingActionsForDevice: () => [],
      navigateToPostOnboardingHub: () => {},
      getPostOnboardingAction,
    });
  });

  it("should return an empty state if the context isn't properly set (`getPostOnboardingAction` missing)", () => {
    const state = stateAllCompleted;
    mockedHubStateSelector.mockReturnValue(state);
    mockedUsePostOnboardingContext.mockReturnValue({
      getPostOnboardingActionsForDevice: () => [],
      navigateToPostOnboardingHub: () => {},
      getPostOnboardingAction: undefined,
    });

    const { result } = renderHook(() => usePostOnboardingHubState());

    expect(result.current).toEqual({
      deviceModelId: state.deviceModelId,
      lastActionCompleted: null,
      actionsState: [],
    });
  });

  it("should return an empty state if the store is in an empty state", () => {
    const state = defaultHubState;
    mockedHubStateSelector.mockReturnValue(state);

    const { result } = renderHook(() => usePostOnboardingHubState());

    expect(result.current).toEqual({
      deviceModelId: state.deviceModelId,
      lastActionCompleted: null,
      actionsState: [],
    });
  });

  it("should not return actions that have a disabled feature flag ", () => {
    const state = stateAllCompleted;
    mockedHubStateSelector.mockReturnValue(state);
    mockedUseFeatureFlags.mockReturnValue(mockedGetFeatureWithMockFeatureEnabled(false));

    const {
      result: {
        current: { actionsState, lastActionCompleted },
      },
    } = renderHook(() => usePostOnboardingHubState());

    expect(actionsState.find(action => action.featureFlagId === mockedFeatureIdToTest)).toBe(
      undefined,
    );
    expect(lastActionCompleted).toBe(null);
  });

  it("should return actions that have a feature flag enabled", () => {
    const state = stateAllCompleted;
    mockedHubStateSelector.mockReturnValue(state);
    mockedUseFeatureFlags.mockReturnValue(mockedGetFeatureWithMockFeatureEnabled(true));

    const {
      result: {
        current: { actionsState, lastActionCompleted },
      },
    } = renderHook(() => usePostOnboardingHubState());

    expect(
      actionsState.find(action => action.featureFlagId === mockedFeatureIdToTest),
    ).toBeTruthy();
    expect(lastActionCompleted).toBeTruthy();
  });

  it("should return actions in their correct state (all actions completed)", () => {
    const state = stateAllCompleted;
    mockedHubStateSelector.mockReturnValue(state);
    mockedUseFeatureFlags.mockReturnValue(mockedGetFeatureWithMockFeatureEnabled(true));

    const {
      result: {
        current: { actionsState },
      },
    } = renderHook(() => usePostOnboardingHubState());

    expect(actionsState.every(action => action.completed)).toBe(true);
  });

  it("should return actions in their correct state (no actions completed)", () => {
    const state = stateAllNotCompleted;
    mockedHubStateSelector.mockReturnValue(state);
    mockedUseFeatureFlags.mockReturnValue(mockedGetFeatureWithMockFeatureEnabled(true));

    const {
      result: {
        current: { actionsState },
      },
    } = renderHook(() => usePostOnboardingHubState());

    expect(actionsState.every(action => action.completed)).toBe(false);
  });
});
