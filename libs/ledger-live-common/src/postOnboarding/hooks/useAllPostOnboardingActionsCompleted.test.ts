import { PostOnboardingHubState } from "@ledgerhq/types-live";
import { renderHook } from "@testing-library/react-hooks";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { claimTestMock, personalizeTestMock, migrateAssetsTestMock } from "../mock";

import { usePostOnboardingHubState } from "./usePostOnboardingHubState";
jest.mock("./usePostOnboardingHubState");
jest.mock("react-redux", () => ({}));

const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

const mockedStateNoActions: PostOnboardingHubState = {
  deviceModelId: null,
  lastActionCompleted: null,
  actionsState: [],
  postOnboardingInProgress: false,
};

const mockedStateAllActionsCompleted: PostOnboardingHubState = {
  deviceModelId: null,
  lastActionCompleted: null,
  actionsState: [
    { ...claimTestMock, completed: true },
    { ...personalizeTestMock, completed: true },
    { ...migrateAssetsTestMock, completed: true },
  ],
  postOnboardingInProgress: false,
};

const mockedStateNoActionsCompleted: PostOnboardingHubState = {
  deviceModelId: null,
  lastActionCompleted: null,
  actionsState: [
    { ...claimTestMock, completed: false },
    { ...personalizeTestMock, completed: false },
    { ...migrateAssetsTestMock, completed: false },
  ],
  postOnboardingInProgress: false,
};

const mockedStateSomeActionsCompleted: PostOnboardingHubState = {
  deviceModelId: null,
  lastActionCompleted: null,
  actionsState: [
    { ...claimTestMock, completed: false },
    { ...personalizeTestMock, completed: true },
    { ...migrateAssetsTestMock, completed: false },
  ],
  postOnboardingInProgress: false,
};

describe("useAllPostOnboardingActionsCompleted", () => {
  it("should return true if no actions are present", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(mockedStateNoActions);
    const { result } = renderHook(() => useAllPostOnboardingActionsCompleted());
    expect(result.current).toBe(true);
  });

  it("should return true if all actions are completed", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(mockedStateAllActionsCompleted);
    const { result } = renderHook(() => useAllPostOnboardingActionsCompleted());
    expect(result.current).toBe(true);
  });

  it("should return false if some actions are completed", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(mockedStateSomeActionsCompleted);
    const { result } = renderHook(() => useAllPostOnboardingActionsCompleted());
    expect(result.current).toBe(false);
  });

  it("should return false if no actions are completed", () => {
    mockedUsePostOnboardingHubState.mockReturnValue(mockedStateNoActionsCompleted);
    const { result } = renderHook(() => useAllPostOnboardingActionsCompleted());
    expect(result.current).toBe(false);
  });
});
