/**
 * @jest-environment jsdom
 */

import { renderHook, act } from "@testing-library/react";
import { DeviceModelId } from "@ledgerhq/devices";
import { PostOnboardingAction, PostOnboardingActionId } from "@ledgerhq/types-live";
import { initPostOnboarding, postOnboardingSetFinished } from "../actions";
import { claimTestMock, mockedFeatureIdToTest, personalizeTestMock } from "../mock";
import { useStartPostOnboardingCallback } from "./useStartPostOnboardingCallback";

const mockedDispatch = jest.fn();
const mockedNavigate = jest.fn();
const mockedGetActions = jest.fn<PostOnboardingAction[], []>();
let mockedState: unknown = {};
let mockedFlags: Record<string, { enabled: boolean }> = {};

jest.mock("react-redux", () => ({
  useDispatch: () => mockedDispatch,
  useStore: () => ({ getState: () => mockedState }),
}));
jest.mock("@features/platform-feature-flags", () => ({
  useFeatureFlags: () => mockedFlags,
}));
jest.mock("./usePostOnboardingContext", () => ({
  usePostOnboardingContext: () => ({
    getPostOnboardingActionsForDevice: mockedGetActions,
    navigateToPostOnboardingHub: mockedNavigate,
  }),
}));

const recoverAction: PostOnboardingAction = {
  ...claimTestMock,
  id: PostOnboardingActionId.recover,
};
const deviceModelId = DeviceModelId.stax;

function queueState(
  actionsToComplete: PostOnboardingActionId[],
  actionsCompleted: { [key in PostOnboardingActionId]?: boolean } = {},
) {
  return { postOnboarding: { actionsToComplete, actionsCompleted } };
}

function start(options: Parameters<ReturnType<typeof useStartPostOnboardingCallback>>[0]) {
  const { result } = renderHook(() => useStartPostOnboardingCallback());
  act(() => result.current(options));
}

describe("useStartPostOnboardingCallback", () => {
  beforeEach(() => {
    mockedDispatch.mockClear();
    mockedNavigate.mockClear();
    mockedGetActions.mockReset();
    mockedState = {};
    mockedFlags = {};
  });

  it("should init the hub with every available action and navigate to it", () => {
    mockedGetActions.mockReturnValue([claimTestMock]);

    start({ deviceModelId, resetNavigationStack: true });

    expect(mockedDispatch).toHaveBeenCalledWith(
      initPostOnboarding({ deviceModelId, actionsIds: [claimTestMock.id] }),
    );
    expect(mockedNavigate).toHaveBeenCalledWith(true);
  });

  it("should drop an action whose feature flag is disabled", () => {
    mockedGetActions.mockReturnValue([claimTestMock, personalizeTestMock]);
    mockedFlags = { [mockedFeatureIdToTest]: { enabled: false } };

    start({ deviceModelId });

    expect(mockedDispatch).toHaveBeenCalledWith(
      initPostOnboarding({ deviceModelId, actionsIds: [claimTestMock.id] }),
    );
  });

  it("should keep an action whose feature flag is enabled", () => {
    mockedGetActions.mockReturnValue([claimTestMock, personalizeTestMock]);
    mockedFlags = { [mockedFeatureIdToTest]: { enabled: true } };

    start({ deviceModelId });

    expect(mockedDispatch).toHaveBeenCalledWith(
      initPostOnboarding({
        deviceModelId,
        actionsIds: [claimTestMock.id, personalizeTestMock.id],
      }),
    );
  });

  it("should hide the Recover action unless the caller can show it", () => {
    mockedGetActions.mockReturnValue([claimTestMock, recoverAction]);

    start({ deviceModelId });
    start({ deviceModelId, canShowRecover: true });

    expect(mockedDispatch).toHaveBeenNthCalledWith(
      1,
      initPostOnboarding({ deviceModelId, actionsIds: [claimTestMock.id] }),
    );
    expect(mockedDispatch).toHaveBeenNthCalledWith(
      2,
      initPostOnboarding({ deviceModelId, actionsIds: [claimTestMock.id, recoverAction.id] }),
    );
  });

  it("should keep a deferred Recover action that is still queued", () => {
    mockedGetActions.mockReturnValue([claimTestMock, recoverAction]);
    mockedState = queueState([PostOnboardingActionId.recover]);

    start({ deviceModelId });

    expect(mockedDispatch).toHaveBeenCalledWith(
      initPostOnboarding({ deviceModelId, actionsIds: [claimTestMock.id, recoverAction.id] }),
    );
  });

  it("should drop a queued Recover action that was completed", () => {
    mockedGetActions.mockReturnValue([claimTestMock, recoverAction]);
    mockedState = queueState([PostOnboardingActionId.recover], {
      [PostOnboardingActionId.recover]: true,
    });

    start({ deviceModelId });

    expect(mockedDispatch).toHaveBeenCalledWith(
      initPostOnboarding({ deviceModelId, actionsIds: [claimTestMock.id] }),
    );
  });

  it("should finish the post onboarding and fall back when no action is available", () => {
    mockedGetActions.mockReturnValue([]);
    const fallbackIfNoAction = jest.fn();

    start({ deviceModelId, fallbackIfNoAction });

    expect(mockedDispatch).toHaveBeenCalledWith(postOnboardingSetFinished());
    expect(fallbackIfNoAction).toHaveBeenCalledTimes(1);
    expect(mockedNavigate).not.toHaveBeenCalled();
  });

  it("should finish the post onboarding without a fallback", () => {
    mockedGetActions.mockReturnValue([]);

    expect(() => start({ deviceModelId })).not.toThrow();

    expect(mockedDispatch).toHaveBeenCalledWith(postOnboardingSetFinished());
    expect(mockedNavigate).not.toHaveBeenCalled();
  });
});
