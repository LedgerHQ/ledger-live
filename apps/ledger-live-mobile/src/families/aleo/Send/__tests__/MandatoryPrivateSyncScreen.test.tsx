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
    mockNavigation.replace.mockReset();
    mockUseAleoPrivateSync.mockReset();
    mockStart = jest.fn();
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 0,
      error: null,
      start: mockStart,
      stop: jest.fn(),
    });
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  it("wires the real sync hook with the main account, autoStart, and no keepAliveOnUnmount", () => {
    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    expect(mockUseAleoPrivateSync).toHaveBeenCalledWith(
      expect.objectContaining({ account: ALEO_ACCOUNT_1, autoStart: true }),
    );
    expect(mockUseAleoPrivateSync).not.toHaveBeenCalledWith(
      expect.objectContaining({ keepAliveOnUnmount: true }),
    );
  });

  it("renders the syncing state with interpolated progress and does not navigate", () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: true,
      progress: 42,
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

    expect(screen.getByText("Syncing your private balance (42%)")).toBeOnTheScreen();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });

  it("navigates to SendAmountCoin once syncing completes", () => {
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

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigation.replace).toHaveBeenCalledTimes(1);
    expect(mockNavigation.replace).toHaveBeenCalledWith(ScreenName.SendAmountCoin, {
      accountId: ALEO_ACCOUNT_1.id,
      parentId: undefined,
      transaction: mockTransaction,
    });
  });

  it("does not navigate if progress reaches 100 while an error is set", () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 100,
      error: new Error("sync failed"),
      start: mockStart,
      stop: jest.fn(),
    });

    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigation.replace).not.toHaveBeenCalled();
    expect(screen.getByText("Private sync failed")).toBeOnTheScreen();
  });

  it("renders retry UI on error and does not navigate", () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 30,
      error: new Error("sync failed"),
      start: mockStart,
      stop: jest.fn(),
    });

    render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    expect(screen.getByText("Private sync failed")).toBeOnTheScreen();
    expect(screen.getByText("Retry")).toBeOnTheScreen();
    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });

  it("calls start() when the retry button is pressed", async () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 30,
      error: new Error("sync failed"),
      start: mockStart,
      stop: jest.fn(),
    });

    const { user } = render(
      <MandatoryPrivateSyncScreen
        navigation={mockNavigation as never}
        route={mockRoute as never}
      />,
    );

    await user.press(screen.getByText("Retry"));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("cancels the pending navigation on unmount before the delay fires", () => {
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

    act(() => {
      jest.advanceTimersByTime(1000);
    });

    expect(mockNavigation.replace).not.toHaveBeenCalled();
  });
});
