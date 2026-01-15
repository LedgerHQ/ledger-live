import React from "react";
import { renderHook } from "@testing-library/react-native";
import { AuthorizationStatus } from "@react-native-firebase/messaging";
import { useNotificationsPrompt } from "../hooks/useNotificationsPrompt";

jest.mock("@ledgerhq/live-common/featureFlags/useFeature");

describe("NotificationsPrompt Integration", () => {
  it("should determine when to show notification prompt for first-time user", () => {
    const { result } = renderHook(() =>
      useNotificationsPrompt({
        permissionStatus: AuthorizationStatus.NOT_DETERMINED,
        areNotificationsAllowed: undefined,
        pushNotificationsDataOfUser: undefined,
      }),
    );

    expect(result.current.shouldPromptOptInDrawerCallback()).toBe(true);
  });

  it("should not show prompt when user has already authorized notifications", () => {
    const { result } = renderHook(() =>
      useNotificationsPrompt({
        permissionStatus: AuthorizationStatus.AUTHORIZED,
        areNotificationsAllowed: true,
        pushNotificationsDataOfUser: {
          dismissedOptInDrawerAtList: undefined,
        },
      }),
    );

    expect(result.current.shouldPromptOptInDrawerCallback()).toBe(false);
  });
});
