import React from "react";
import { render, screen } from "@tests/test-renderer";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { ALEO_ACCOUNT_1 } from "../__mocks__/account.mock";
import PrivateSyncButton from "../PrivateSyncButton";
import { useAleoPrivateSync } from "../hooks/useAleoPrivateSync";

jest.mock("~/context/Locale", () => ({
  useTranslation: () => ({ t: (key: string) => key }),
}));

jest.mock("../hooks/useAleoPrivateSync");

const mockUseAleoPrivateSync = jest.mocked(useAleoPrivateSync);

const baseAccount: AleoAccount = {
  ...(ALEO_ACCOUNT_1 as AleoAccount),
  aleoResources: {
    transparentBalance: null,
    provableApi: null,
    privateBalance: null,
    unspentPrivateRecords: null,
    lastPrivateSyncDate: null,
  },
};

describe("PrivateSyncButton", () => {
  let mockStart: jest.Mock;
  let mockStop: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    mockStart = jest.fn();
    mockStop = jest.fn();
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 0,
      error: null,
      start: mockStart,
      stop: mockStop,
    });
  });

  it("passes autoStart: true and keepAliveOnUnmount: true for an unsynced account", () => {
    render(<PrivateSyncButton account={baseAccount} />);

    expect(mockUseAleoPrivateSync).toHaveBeenCalledWith(
      expect.objectContaining({
        account: baseAccount,
        autoStart: true,
        keepAliveOnUnmount: true,
      }),
    );
  });

  it("passes autoStart: false for an already-synced account", () => {
    const syncedAccount: AleoAccount = {
      ...baseAccount,
      aleoResources: { ...baseAccount.aleoResources!, lastPrivateSyncDate: new Date() },
    };

    render(<PrivateSyncButton account={syncedAccount} />);

    expect(mockUseAleoPrivateSync).toHaveBeenCalledWith(
      expect.objectContaining({ autoStart: false }),
    );
  });

  it("shows the start-sync button in the ready state", () => {
    render(<PrivateSyncButton account={baseAccount} />);

    expect(screen.getByTestId("start-private-sync-button")).toBeOnTheScreen();
    expect(screen.queryByTestId("stop-private-sync-button")).not.toBeOnTheScreen();
    expect(screen.queryByTestId("sync-again-button")).not.toBeOnTheScreen();
  });

  it("calls start() when the start-sync button is pressed", async () => {
    const { user } = render(<PrivateSyncButton account={baseAccount} />);

    await user.press(screen.getByTestId("start-private-sync-button"));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });

  it("shows the stop-sync button and progress while syncing", () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: true,
      progress: 42,
      error: null,
      start: mockStart,
      stop: mockStop,
    });

    render(<PrivateSyncButton account={baseAccount} />);

    expect(screen.getByTestId("stop-private-sync-button")).toBeOnTheScreen();
    expect(screen.getByText("42%")).toBeOnTheScreen();
  });

  it("calls stop() when the stop-sync button is pressed", async () => {
    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: true,
      progress: 42,
      error: null,
      start: mockStart,
      stop: mockStop,
    });

    const { user } = render(<PrivateSyncButton account={baseAccount} />);

    await user.press(screen.getByTestId("stop-private-sync-button"));

    expect(mockStop).toHaveBeenCalledTimes(1);
  });

  it("shows the sync-again button and last sync text once synced", () => {
    const syncedAccount: AleoAccount = {
      ...baseAccount,
      aleoResources: { ...baseAccount.aleoResources!, lastPrivateSyncDate: new Date() },
    };

    render(<PrivateSyncButton account={syncedAccount} />);

    expect(screen.getByTestId("sync-again-button")).toBeOnTheScreen();
    expect(screen.getByText("aleo.account.syncButton.lastSync")).toBeOnTheScreen();
  });

  it("calls start() when the sync-again button is pressed", async () => {
    const syncedAccount: AleoAccount = {
      ...baseAccount,
      aleoResources: { ...baseAccount.aleoResources!, lastPrivateSyncDate: new Date() },
    };

    const { user } = render(<PrivateSyncButton account={syncedAccount} />);

    await user.press(screen.getByTestId("sync-again-button"));

    expect(mockStart).toHaveBeenCalledTimes(1);
  });
});
