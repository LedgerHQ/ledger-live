import BigNumber from "bignumber.js";
import React from "react";
import { Subject } from "rxjs";
import { act, render, screen, waitFor } from "tests/testSetup";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { AFTER_ONBOARDING_STATE } from "~/renderer/reducers/settings";
import AccountBalanceSummaryFooter from "../AccountBalanceSummaryFooter";
import { ALEO_MAIN_ACCOUNT, ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT } from "../__mocks__/account.mock";
import { mockAleoCoinConfig } from "../__mocks__/config.mock";
import { getAleoCurrencyConfig } from "../shared/utils";

jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("../shared/utils", () => ({
  ...jest.requireActual("../shared/utils"),
  getAleoCurrencyConfig: jest.fn(),
}));

const { getAccountBridge } = jest.requireMock("@ledgerhq/live-common/bridge/impl");
const mockGetAleoCurrencyConfig = jest.mocked(getAleoCurrencyConfig);

let uniqueAccountCounter = 0;
const makeUniqueAccount = (lastPrivateSyncDate: Date | null = null): AleoAccount => ({
  ...ALEO_MAIN_ACCOUNT,
  id: `${ALEO_MAIN_ACCOUNT.id}-integration-${++uniqueAccountCounter}`,
  aleoResources: {
    transparentBalance: new BigNumber(100_000_000),
    privateBalance: new BigNumber(50_000_000),
    unspentPrivateRecords: [],
    provableApi: null,
    lastPrivateSyncDate,
  },
});

describe("AccountBalanceSummaryFooter (integration)", () => {
  let syncSubject: Subject<(acc: AleoAccount) => AleoAccount>;
  let mockSync: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();
    syncSubject = new Subject();
    mockSync = jest.fn().mockReturnValue(syncSubject.asObservable());
    getAccountBridge.mockReturnValue({ sync: mockSync });
    mockGetAleoCurrencyConfig.mockReturnValue(mockAleoCoinConfig);
  });

  afterEach(() => {
    syncSubject.complete();
  });

  const setup = (account = makeUniqueAccount()) =>
    render(<AccountBalanceSummaryFooter account={account} />, {
      initialState: {
        settings: AFTER_ONBOARDING_STATE,
        accounts: [account],
      },
    });

  describe("auto-start on mount", () => {
    it("should call bridge.sync automatically when lastPrivateSyncDate is null", async () => {
      setup();
      await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));
    });

    it("should NOT call bridge.sync when lastPrivateSyncDate is already set", () => {
      setup(makeUniqueAccount(new Date("2024-01-01")));
      expect(mockSync).not.toHaveBeenCalled();
    });
  });

  describe("button state while syncing", () => {
    it("should show 'Stop sync' button while the sync observable is open", async () => {
      setup();
      await waitFor(() => expect(screen.getByTestId("stop-private-sync-button")).toBeVisible());
    });

    it("should show 0% progress immediately after sync starts", async () => {
      setup();
      await waitFor(() => expect(screen.getByTestId("stop-private-sync-button")).toBeVisible());
      expect(screen.getByText("0%")).toBeVisible();
    });
  });

  describe("stop sync", () => {
    it("should revert to 'Start sync' immediately after clicking 'Stop sync'", async () => {
      const { user } = setup();
      await waitFor(() => expect(screen.getByTestId("stop-private-sync-button")).toBeVisible());

      await user.click(screen.getByTestId("stop-private-sync-button"));

      expect(screen.getByTestId("start-private-sync-button")).toBeVisible();
    });

    it("should not call bridge.sync a second time after stopping", async () => {
      const { user } = setup();
      await waitFor(() => expect(screen.getByTestId("stop-private-sync-button")).toBeVisible());

      await user.click(screen.getByTestId("stop-private-sync-button"));

      expect(mockSync).toHaveBeenCalledTimes(1);
    });
  });

  describe("restart sync", () => {
    it("should start a second sync when 'Start sync' is clicked after stopping", async () => {
      const { user } = setup();
      await waitFor(() => expect(screen.getByTestId("stop-private-sync-button")).toBeVisible());

      await user.click(screen.getByTestId("stop-private-sync-button"));
      expect(screen.getByTestId("start-private-sync-button")).toBeVisible();

      // Prepare a fresh observable for the second sync
      syncSubject = new Subject();
      mockSync.mockReturnValue(syncSubject.asObservable());

      await user.click(screen.getByTestId("start-private-sync-button"));

      await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(2));
      expect(screen.getByTestId("stop-private-sync-button")).toBeVisible();
    });
  });

  describe("sync completion", () => {
    it("should show 'Sync again' button after the sync observable emits the final result", async () => {
      const account = makeUniqueAccount();
      const syncedAccount: AleoAccount = {
        ...account,
        aleoResources: { ...account.aleoResources!, lastPrivateSyncDate: new Date() },
      };
      const { rerender } = setup(account);

      await Promise.resolve(); // flush bridge observable subscription setup

      await act(async () => {
        syncSubject.next(() => syncedAccount);
      });

      // Simulate the parent component passing the Redux-updated account as a prop
      act(() => {
        rerender(<AccountBalanceSummaryFooter account={syncedAccount} />);
      });

      await waitFor(() => expect(screen.getByTestId("sync-again-button")).toBeVisible(), {
        timeout: 1000,
      });
    });

    it("should show 'Sync again' button immediately when account has lastPrivateSyncDate set", () => {
      const alreadySynced = makeUniqueAccount(new Date("2024-01-01"));
      setup(alreadySynced);

      expect(screen.getByTestId("sync-again-button")).toBeVisible();
      expect(mockSync).not.toHaveBeenCalled();
    });

    it("should start a new sync when 'Sync again' is clicked on an already-synced account", async () => {
      const alreadySynced = makeUniqueAccount(new Date("2024-01-01"));
      const { user } = setup(alreadySynced);

      expect(screen.getByTestId("sync-again-button")).toBeVisible();
      expect(mockSync).not.toHaveBeenCalled();

      syncSubject = new Subject();
      mockSync.mockReturnValue(syncSubject.asObservable());

      await user.click(screen.getByTestId("sync-again-button"));

      await waitFor(() => expect(mockSync).toHaveBeenCalledTimes(1));
      expect(screen.getByTestId("stop-private-sync-button")).toBeVisible();
    });
  });

  describe("balance rows", () => {
    it("should always render available, transparent, and private balance labels", () => {
      setup();
      expect(screen.getByText(/available balance/i)).toBeVisible();
      expect(screen.getByText(/transparent balance/i)).toBeVisible();
      expect(screen.getByText(/private balance/i)).toBeVisible();
    });
  });

  describe("token account", () => {
    it("should render balance rows without any sync button when tokens are enabled", () => {
      mockGetAleoCurrencyConfig.mockReturnValue({ ...mockAleoCoinConfig, enableTokens: true });

      render(<AccountBalanceSummaryFooter account={ALEO_TOKEN_ACCOUNT} />, {
        initialState: {
          settings: AFTER_ONBOARDING_STATE,
          accounts: [ALEO_ACCOUNT_1], // parent account for getParentAccount
        },
      });

      expect(screen.queryByTestId("start-private-sync-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("stop-private-sync-button")).not.toBeInTheDocument();
      expect(screen.queryByTestId("sync-again-button")).not.toBeInTheDocument();
      expect(screen.getByText(/available balance/i)).toBeVisible();
      expect(screen.getByText(/transparent balance/i)).toBeVisible();
      expect(screen.getByText(/private balance/i)).toBeVisible();
      expect(mockSync).not.toHaveBeenCalled();
    });
  });
});
