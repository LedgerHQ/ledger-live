import React from "react";
import { AppState, type AppStateStatus, View } from "react-native";
import { act, render } from "@testing-library/react-native";
import { useCardAssetsViewModel } from "../useCardAssetsViewModel.native";
import type { CardAssetsViewModel } from "../types";

const mockUseCardAssetsViewModelBase = jest.fn();

jest.mock("../useCardAssetsViewModelBase", () => ({
  useCardAssetsViewModel: (...args: unknown[]) => mockUseCardAssetsViewModelBase(...args),
  formatCardAssetCryptoAmount: jest.fn(),
}));

function ViewModelProbe() {
  useCardAssetsViewModel();
  return <View />;
}

describe("useCardAssetsViewModel native", () => {
  let appStateListener: ((state: AppStateStatus) => void) | undefined;
  let removeAppStateListener: jest.Mock;
  let appStateAddEventListenerSpy: jest.SpiedFunction<typeof AppState.addEventListener>;
  let onRetryPress: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    appStateListener = undefined;
    removeAppStateListener = jest.fn();
    onRetryPress = jest.fn();
    mockUseCardAssetsViewModelBase.mockReturnValue({
      onRetryPress,
    } as unknown as CardAssetsViewModel);
    appStateAddEventListenerSpy = jest
      .spyOn(AppState, "addEventListener")
      .mockImplementation((_event, listener) => {
        appStateListener = listener;
        return { remove: removeAppStateListener };
      });
  });

  afterEach(() => {
    appStateAddEventListenerSpy.mockRestore();
  });

  it("refetches Card assets when the app returns from the background", async () => {
    render(<ViewModelProbe />);

    await act(async () => {
      appStateListener?.("background");
      appStateListener?.("active");
    });

    expect(onRetryPress).toHaveBeenCalledTimes(1);
  });

  it("does not refetch while the app remains active", async () => {
    render(<ViewModelProbe />);

    await act(async () => appStateListener?.("active"));

    expect(onRetryPress).not.toHaveBeenCalled();
  });

  it("removes the AppState listener when unmounted", async () => {
    const { unmount } = render(<ViewModelProbe />);

    await act(async () => unmount());

    expect(removeAppStateListener).toHaveBeenCalledTimes(1);
  });
});
