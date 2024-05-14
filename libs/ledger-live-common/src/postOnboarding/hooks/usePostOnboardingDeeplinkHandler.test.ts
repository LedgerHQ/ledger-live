/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { usePostOnboardingDeeplinkHandler } from "./usePostOnboardingDeeplinkHandler";

import { PostOnboardingHubState } from "@ledgerhq/types-live";
import { DeviceModelId } from "@ledgerhq/devices";

import {
  postOnboardingDeviceModelIdSelector,
  walletPostOnboardingEntryPointDismissedSelector,
} from "../reducer";
import { useAllPostOnboardingActionsCompleted } from "./useAllPostOnboardingActionsCompleted";
import { usePostOnboardingHubState } from "./usePostOnboardingHubState";
import { claimTestMock, personalizeTestMock, migrateAssetsTestMock } from "../mock";

const mockedDispatch = jest.fn();
jest.mock("react-redux", () => ({
  useSelector: fun => fun(),
  useDispatch: () => mockedDispatch,
}));

jest.mock("../reducer");
jest.mock("./useAllPostOnboardingActionsCompleted");
jest.mock("./usePostOnboardingHubState");

const mockedUseAllCompleted = jest.mocked(useAllPostOnboardingActionsCompleted);
const mockedDismissedSelector = jest.mocked(walletPostOnboardingEntryPointDismissedSelector);
const mockedDeviceModelIdSelector = jest.mocked(postOnboardingDeviceModelIdSelector);
const mockedUsePostOnboardingHubState = jest.mocked(usePostOnboardingHubState);

const mockedStateNoActionsCompleted: PostOnboardingHubState = {
  deviceModelId: DeviceModelId.stax,
  lastActionCompleted: null,
  actionsState: [
    { ...claimTestMock, completed: false },
    { ...personalizeTestMock, completed: false },
    { ...migrateAssetsTestMock, completed: false },
  ],
  postOnboardingInProgress: false,
};

describe("usePostOnboardingDeeplinkHandler", () => {
  beforeEach(() => {
    mockedUseAllCompleted.mockClear();
    mockedDismissedSelector.mockClear();
    mockedDeviceModelIdSelector.mockClear();
    mockedDispatch.mockClear();
    mockedUsePostOnboardingHubState.mockClear();
  });

  test("should navigate to the post onboarding hub when called with a stax device model id", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.stax);
    mockedUsePostOnboardingHubState.mockReturnValue(mockedStateNoActionsCompleted);

    const navigateToHome = jest.fn();
    const navigateToPostOnboardingHub = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingDeeplinkHandler(navigateToHome, navigateToPostOnboardingHub),
    );

    act(() => {
      result.current("stax");
    });

    expect(navigateToPostOnboardingHub).toHaveBeenCalled();
    expect(navigateToHome).not.toHaveBeenCalled();
  });

  test("should navigate to the home when called with no device parameter", () => {
    mockedDismissedSelector.mockReturnValue(false);
    mockedUseAllCompleted.mockReturnValue(false);
    mockedDeviceModelIdSelector.mockReturnValue(DeviceModelId.nanoSP);
    mockedUsePostOnboardingHubState.mockReturnValue(mockedStateNoActionsCompleted);

    const navigateToHome = jest.fn();
    const navigateToPostOnboardingHub = jest.fn();
    const { result } = renderHook(() =>
      usePostOnboardingDeeplinkHandler(navigateToHome, navigateToPostOnboardingHub),
    );

    act(() => {
      result.current();
    });

    expect(navigateToPostOnboardingHub).not.toHaveBeenCalled();
    expect(navigateToHome).toHaveBeenCalled();
  });
});
