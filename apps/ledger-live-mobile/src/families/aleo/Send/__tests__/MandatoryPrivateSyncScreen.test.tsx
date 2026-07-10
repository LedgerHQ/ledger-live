import React from "react";
import { act, render, screen } from "@tests/test-renderer";
import { MandatoryPrivateSyncScreen } from "../MandatoryPrivateSyncScreen";
import { ScreenName } from "~/const";
import { ALEO_ACCOUNT_1 } from "../../__mocks__/account.mock";
import { useAleoPrivateSync } from "../../hooks/useAleoPrivateSync";

jest.mock("../../hooks/useAleoPrivateSync");

const mockUseAleoPrivateSync = jest.mocked(useAleoPrivateSync);
const mockTransaction = { family: "aleo", recipient: "aleo1abc" } as never;

function makeNavigation() {
  return { replace: jest.fn() };
}
function makeRoute() {
  return {
    key: "aleo-private-sync",
    name: "AleoMandatoryPrivateSync" as const,
    params: { account: ALEO_ACCOUNT_1, parentAccount: undefined, transaction: mockTransaction },
  };
}

describe("MandatoryPrivateSyncScreen", () => {
  const mockNavigation = makeNavigation();
  const mockRoute = makeRoute();
  let mockStart: jest.Mock;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.clearAllMocks();
    mockNavigation.replace.mockReset();
    mockStart = jest.fn();
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: true,
      progress: 0,
      error: null,
      start: mockStart,
      stop: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("calls useAleoPrivateSync with autoStart:true and no keepAliveOnUnmount", () => {
    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    expect(mockUseAleoPrivateSync).toHaveBeenCalledWith(
      expect.objectContaining({ autoStart: true }),
    );
    expect(mockUseAleoPrivateSync.mock.calls[0][0].keepAliveOnUnmount).toBeUndefined();
  });

  it("does not navigate while sync is in progress", () => {
    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );
    act(() => jest.advanceTimersByTime(5000));

    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });

  it("navigates to SendAmountCoin once progress reaches 100 and sync has stopped", () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 100,
      error: null,
      start: mockStart,
      stop: jest.fn(),
    });

    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );
    act(() => jest.advanceTimersByTime(500));

    expect(mockNavigation.replace).toHaveBeenCalledWith(
      ScreenName.SendAmountCoin,
      expect.objectContaining({ accountId: ALEO_ACCOUNT_1.id, transaction: mockTransaction }),
    );
  });

  it("shows a retry button and does not navigate when sync errors", () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 40,
      error: new Error("boom"),
      start: mockStart,
      stop: jest.fn(),
    });

    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );
    act(() => jest.advanceTimersByTime(5000));

    expect(mockNavigation.replace).not.toHaveBeenCalled();
    expect(screen.getByTestId("private-sync-retry-button")).toBeOnTheScreen();
  });

  it("calls start() again when retry is pressed", async () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 40,
      error: new Error("boom"),
      start: mockStart,
      stop: jest.fn(),
    });

    const { user } = render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );
    await user.press(screen.getByTestId("private-sync-retry-button"));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("cancels the settle timer on unmount", () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 100,
      error: null,
      start: mockStart,
      stop: jest.fn(),
    });

    const { unmount } = render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );
    unmount();
    act(() => jest.advanceTimersByTime(500));

    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });
});
