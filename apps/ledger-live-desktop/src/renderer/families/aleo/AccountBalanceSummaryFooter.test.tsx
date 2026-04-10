import BigNumber from "bignumber.js";
import React from "react";
import { Subject } from "rxjs";
import { act, fireEvent, render, screen } from "tests/testSetup";
import * as currencies from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { isBackgroundSyncPending$ } from "@ledgerhq/live-common/families/aleo/sync";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import { PRIVATE_BALANCE_PLACEHOLDER } from "./constants";
import { ALEO_ACCOUNT_1 } from "./__mocks__/account.mock";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/currencies/index");
jest.mock("@ledgerhq/live-common/bridge/impl");
jest.mock("~/renderer/actions/accounts", () => ({
  ...jest.requireActual("~/renderer/actions/accounts"),
  updateAccountWithUpdater: jest
    .fn()
    .mockImplementation((accountId: string, updater: (a: unknown) => unknown) => ({
      type: "UPDATE_ACCOUNT",
      payload: { accountId, updater },
    })),
}));

const { getAccountBridge } = jest.requireMock("@ledgerhq/live-common/bridge/impl");

const mockUseAccountUnit = jest.mocked(useAccountUnit);

describe("AccountBalanceSummaryFooter", () => {
  const mockSpendableBalance = BigNumber(100);
  const mockTransparentBalance = BigNumber(60);
  let syncSubject: Subject<(acc: AleoAccount) => AleoAccount>;
  let mockSync: jest.Mock;
  const mockAccount: AleoAccount = {
    ...ALEO_ACCOUNT_1,
    spendableBalance: mockSpendableBalance,
    aleoResources: {
      transparentBalance: mockTransparentBalance,
      provableApi: null,
      privateBalance: null,
      unspentPrivateRecords: [],
      lastPrivateSyncDate: null,
    },
  };

  beforeEach(() => {
    jest.clearAllMocks();
    isBackgroundSyncPending$.next(false);

    mockUseAccountUnit.mockReturnValue({
      code: "ALEO",
      name: "Aleo",
      magnitude: 6,
    });

    jest
      .spyOn(currencies, "formatCurrencyUnit")
      .mockImplementation((_unit, value, _formatConfig) => {
        return value ? `formatted: ${value.toString()}` : PRIVATE_BALANCE_PLACEHOLDER;
      });

    syncSubject = new Subject();
    mockSync = jest.fn().mockReturnValue(syncSubject.asObservable());
    getAccountBridge.mockReturnValue({ sync: mockSync });
  });

  afterEach(() => {
    if (!syncSubject.closed) syncSubject.complete();
    jest.useRealTimers();
  });

  it("should display available balance and transparent balance", () => {
    render(<AccountBalanceSummaryFooter account={mockAccount} />);

    expect(screen.getByText("Available balance")).toBeInTheDocument();
    expect(screen.getByText(`formatted: ${mockSpendableBalance}`)).toBeInTheDocument();

    expect(screen.getByText("Transparent balance")).toBeInTheDocument();
    expect(screen.getByText(`formatted: ${mockTransparentBalance}`)).toBeInTheDocument();
  });

  it("should display *** for private balance when privateBalance is null", () => {
    render(<AccountBalanceSummaryFooter account={mockAccount} />);

    expect(screen.getByText("***")).toBeInTheDocument();
  });

  it("should return null when account type is not Account", () => {
    const { container } = render(
      // @ts-expect-error - testing with a non-Account type at runtime
      <AccountBalanceSummaryFooter account={{ ...mockAccount, type: "TokenAccount" }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  it("should return null when aleoResources is missing", () => {
    const { container } = render(
      <AccountBalanceSummaryFooter account={{ ...mockAccount, aleoResources: undefined }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  describe("sync button", () => {
    it("should show 'Start sync' button when account is not yet synced", () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(screen.getByRole("button", { name: "Start sync" })).toBeInTheDocument();
    });

    it("should show 'Sync again' button when account is already synced", () => {
      const syncedAccount: AleoAccount = {
        ...mockAccount,
        aleoResources: {
          transparentBalance: mockTransparentBalance,
          privateBalance: null,
          unspentPrivateRecords: [],
          lastPrivateSyncDate: new Date(),
          provableApi: { scannerStatus: { synced: true, percentage: 100 } },
        },
      };

      render(<AccountBalanceSummaryFooter account={syncedAccount} />);

      expect(screen.getByRole("button", { name: "Sync again" })).toBeInTheDocument();
    });

    it("should show 'Stop sync' button after clicking 'Start sync'", async () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Start sync" }));
      });

      expect(screen.getByRole("button", { name: "Stop sync" })).toBeInTheDocument();
    });

    it("should return to 'Start sync' button after clicking 'Stop sync'", async () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Start sync" }));
      });

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Stop sync" }));
      });

      expect(screen.getByRole("button", { name: "Start sync" })).toBeInTheDocument();
    });

    it("should display sync progress percentage while syncing", async () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Start sync" }));
      });

      await act(async () => {
        syncSubject.next(() => ({
          ...mockAccount,
          aleoResources: {
            transparentBalance: mockTransparentBalance,
            privateBalance: null,
            unspentPrivateRecords: [],
            lastPrivateSyncDate: null,
            provableApi: { scannerStatus: { synced: false, percentage: 37 } },
          },
        }));
      });

      expect(screen.getByText("37%")).toBeInTheDocument();
    });
  });

  describe("finish-delay behaviour", () => {
    const completedAccount: AleoAccount = {
      ...ALEO_ACCOUNT_1,
      spendableBalance: BigNumber(100),
      aleoResources: {
        transparentBalance: BigNumber(60),
        privateBalance: null,
        unspentPrivateRecords: [],
        lastPrivateSyncDate: new Date(),
        provableApi: { scannerStatus: { synced: true, percentage: 100 } },
      },
    };
    const completeUpdater = () => completedAccount;

    it("should still show 'Stop sync' and progress immediately after sync completes at 100%", () => {
      jest.useFakeTimers();
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start sync" }));
      });

      act(() => {
        syncSubject.next(completeUpdater);
        syncSubject.complete();
      });

      // delay hasn't elapsed yet — still showing running state with 100%
      expect(screen.getByRole("button", { name: "Stop sync" })).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should transition to 'Sync again' after the 200ms finish delay elapses", () => {
      jest.useFakeTimers();
      const { rerender } = render(<AccountBalanceSummaryFooter account={mockAccount} />);

      act(() => {
        fireEvent.click(screen.getByRole("button", { name: "Start sync" }));
      });

      act(() => {
        syncSubject.next(completeUpdater);
        syncSubject.complete();
      });

      // Simulate the Redux store updating the account prop after the sync completed
      act(() => {
        rerender(<AccountBalanceSummaryFooter account={completedAccount} />);
      });

      act(() => {
        jest.advanceTimersByTime(200);
      });

      expect(screen.getByRole("button", { name: "Sync again" })).toBeInTheDocument();
    });
  });

  describe("background sync pending — button disabled state", () => {
    afterEach(() => {
      isBackgroundSyncPending$.next(false);
    });

    it("should disable the sync button when isBackgroundSyncPending$ is true", () => {
      act(() => {
        isBackgroundSyncPending$.next(true);
      });

      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(screen.getByRole("button", { name: "Sync pending..." })).toBeDisabled();
    });

    it("should enable the sync button when isBackgroundSyncPending$ is false", () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(screen.getByRole("button", { name: "Start sync" })).not.toBeDisabled();
    });

    it("should disable the button mid-render when isBackgroundSyncPending$ changes to true", () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(screen.getByRole("button", { name: "Start sync" })).not.toBeDisabled();

      act(() => {
        isBackgroundSyncPending$.next(true);
      });

      expect(screen.getByRole("button", { name: "Sync pending..." })).toBeDisabled();
    });

    it("should re-enable the button when isBackgroundSyncPending$ goes back to false", () => {
      act(() => {
        isBackgroundSyncPending$.next(true);
      });

      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(screen.getByRole("button", { name: "Sync pending..." })).toBeDisabled();

      act(() => {
        isBackgroundSyncPending$.next(false);
      });

      expect(screen.getByRole("button", { name: "Start sync" })).not.toBeDisabled();
    });

    it("should disable 'Sync again' button when account is synced and background sync is pending", () => {
      const syncedAccount: AleoAccount = {
        ...mockAccount,
        aleoResources: {
          transparentBalance: mockTransparentBalance,
          privateBalance: null,
          unspentPrivateRecords: [],
          lastPrivateSyncDate: new Date(),
          provableApi: { scannerStatus: { synced: true, percentage: 100 } },
        },
      };

      act(() => {
        isBackgroundSyncPending$.next(true);
      });

      render(<AccountBalanceSummaryFooter account={syncedAccount} />);

      expect(screen.getByRole("button", { name: "Sync pending..." })).toBeDisabled();
    });
  });
});
