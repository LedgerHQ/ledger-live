import React from "react";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { PostOnboardingActionId } from "@ledgerhq/types-live";
import { PostOnboardingProvider } from "@ledgerhq/live-common/postOnboarding/PostOnboardingProvider";
import { renderHook, waitFor } from "@tests/test-renderer";
import type { State } from "~/reducers/types";
import { getPostOnboardingAction, getPostOnboardingActionsForDevice } from "~/logic/postOnboarding";
import { useAutoRedirectToPostOnboarding } from ".";

jest.mock("@react-navigation/core", () => ({
  ...jest.requireActual<typeof import("@react-navigation/core")>("@react-navigation/core"),
  useIsFocused: () => true,
}));

const navigateToPostOnboardingHub = jest.fn();

function PostOnboardingWrapper({ children }: { children?: React.ReactNode }) {
  return (
    <PostOnboardingProvider
      navigateToPostOnboardingHub={navigateToPostOnboardingHub}
      getPostOnboardingAction={getPostOnboardingAction}
      getPostOnboardingActionsForDevice={getPostOnboardingActionsForDevice}
    >
      {children}
    </PostOnboardingProvider>
  );
}

function portfolioAfterRemindLater(recoverCompleted: boolean) {
  return (state: State): State => ({
    ...state,
    settings: {
      ...state.settings,
      hasBeenUpsoldProtect: true,
      hasBeenRedirectedToPostOnboarding: false,
      lastConnectedDevice: {
        deviceId: "device-id",
        modelId: DeviceModelId.nanoX,
        wired: false,
      },
    },
    postOnboarding: {
      ...state.postOnboarding,
      postOnboardingInProgress: false,
      actionsToComplete: [PostOnboardingActionId.recover],
      actionsCompleted: { [PostOnboardingActionId.recover]: recoverCompleted },
    },
  });
}

describe("useAutoRedirectToPostOnboarding", () => {
  beforeEach(() => {
    navigateToPostOnboardingHub.mockClear();
  });

  it("should keep a deferred Recover action when Portfolio starts the hub", async () => {
    const { store } = renderHook(() => useAutoRedirectToPostOnboarding(), {
      overrideInitialState: portfolioAfterRemindLater(false),
      innerWrapper: PostOnboardingWrapper,
    });

    await waitFor(() => {
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
    });

    expect(store.getState().postOnboarding.actionsToComplete).toContain(
      PostOnboardingActionId.recover,
    );
    expect(navigateToPostOnboardingHub).toHaveBeenCalled();
  });

  it("should drop a completed Recover action when Portfolio starts the hub", async () => {
    const { store } = renderHook(() => useAutoRedirectToPostOnboarding(), {
      overrideInitialState: portfolioAfterRemindLater(true),
      innerWrapper: PostOnboardingWrapper,
    });

    await waitFor(() => {
      expect(store.getState().postOnboarding.postOnboardingInProgress).toBe(true);
    });

    expect(store.getState().postOnboarding.actionsToComplete).not.toContain(
      PostOnboardingActionId.recover,
    );
  });
});
