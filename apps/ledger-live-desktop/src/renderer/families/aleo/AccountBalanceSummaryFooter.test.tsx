import BigNumber from "bignumber.js";
import React from "react";
import { act, fireEvent, render, screen } from "tests/testSetup";
import * as currencies from "@ledgerhq/live-common/currencies/index";
import type { AleoAccount } from "@ledgerhq/live-common/families/aleo/types";
import { useAccountUnit } from "~/renderer/hooks/useAccountUnit";
import AccountBalanceSummaryFooter from "./AccountBalanceSummaryFooter";
import { PRIVATE_BALANCE_PLACEHOLDER } from "./constants";
import { useAleoPrivateSync } from "./hooks/useAleoPrivateSync";
import { ALEO_ACCOUNT_1, ALEO_TOKEN_ACCOUNT } from "./__mocks__/account.mock";

jest.mock("~/renderer/hooks/useAccountUnit");
jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  __esModule: true,
  ...jest.requireActual("@ledgerhq/live-common/currencies/index"),
}));
jest.mock("./hooks/useAleoPrivateSync");

const mockUseAccountUnit = jest.mocked(useAccountUnit);
const mockUseAleoPrivateSync = jest.mocked(useAleoPrivateSync);

describe("AccountBalanceSummaryFooter", () => {
  const mockSpendableBalance = BigNumber(100);
  const mockTransparentBalance = BigNumber(60);
  let mockStart: jest.Mock;
  let mockStop: jest.Mock;
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

    mockStart = jest.fn();
    mockStop = jest.fn();

    mockUseAleoPrivateSync.mockReturnValue({
      isSyncing: false,
      progress: 0,
      error: null,
      start: mockStart,
      stop: mockStop,
    });

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
  });

  afterEach(() => {
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
    const { container } = render(<AccountBalanceSummaryFooter account={ALEO_TOKEN_ACCOUNT} />, {
      initialState: { accounts: [mockAccount] },
    });

    expect(container).toBeEmptyDOMElement();
  });

  it("should return null when aleoResources is missing", () => {
    const { container } = render(
      <AccountBalanceSummaryFooter account={{ ...mockAccount, aleoResources: undefined }} />,
    );

    expect(container).toBeEmptyDOMElement();
  });

  describe("sync button", () => {
    it("should show 'Start sync' button when account is not yet synced and hook is idle", () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(screen.getByRole("button", { name: "Start sync" })).toBeInTheDocument();
    });

    it("should pass autoStart: true to the hook for an unsynced account", () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(mockUseAleoPrivateSync).toHaveBeenCalledWith(
        expect.objectContaining({ autoStart: true }),
      );
    });

    it("should pass autoStart: false to the hook for an already-synced account", () => {
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

      expect(mockUseAleoPrivateSync).toHaveBeenCalledWith(
        expect.objectContaining({ autoStart: false }),
      );
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

    it("should show 'Stop sync' button when the hook reports isSyncing: true", () => {
      mockUseAleoPrivateSync.mockReturnValue({
        isSyncing: true,
        progress: 0,
        error: null,
        start: mockStart,
        stop: mockStop,
      });

      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      expect(screen.getByRole("button", { name: "Stop sync" })).toBeInTheDocument();
    });

    it("should call start() when the sync button is clicked in idle state", async () => {
      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Start sync" }));
      });

      expect(mockStart).toHaveBeenCalledTimes(1);
    });

    it("should call stop() when Stop sync is clicked", async () => {
      mockUseAleoPrivateSync.mockReturnValue({
        isSyncing: true,
        progress: 0,
        error: null,
        start: mockStart,
        stop: mockStop,
      });

      render(<AccountBalanceSummaryFooter account={mockAccount} />);

      await act(async () => {
        fireEvent.click(screen.getByRole("button", { name: "Stop sync" }));
      });

      expect(mockStop).toHaveBeenCalledTimes(1);
    });

    it("should display sync progress percentage while syncing", () => {
      mockUseAleoPrivateSync.mockReturnValue({
        isSyncing: true,
        progress: 37,
        error: null,
        start: mockStart,
        stop: mockStop,
      });

      render(<AccountBalanceSummaryFooter account={mockAccount} />);

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

    it("should still show 'Stop sync' and progress immediately after sync completes at 100%", () => {
      jest.useFakeTimers();

      // Start with sync running at 100%
      mockUseAleoPrivateSync.mockReturnValue({
        isSyncing: true,
        progress: 100,
        error: null,
        start: mockStart,
        stop: mockStop,
      });
      const { rerender } = render(<AccountBalanceSummaryFooter account={mockAccount} />);

      // Simulate sync completion: hook transitions to isSyncing: false
      mockUseAleoPrivateSync.mockReturnValue({
        isSyncing: false,
        progress: 100,
        error: null,
        start: mockStart,
        stop: mockStop,
      });
      act(() => {
        rerender(<AccountBalanceSummaryFooter account={mockAccount} />);
      });

      // Delay hasn't elapsed yet — still showing running state with 100%
      expect(screen.getByRole("button", { name: "Stop sync" })).toBeInTheDocument();
      expect(screen.getByText("100%")).toBeInTheDocument();
    });

    it("should transition to 'Sync again' after the 200ms finish delay elapses", () => {
      jest.useFakeTimers();

      // Start with sync running at 100%
      mockUseAleoPrivateSync.mockReturnValue({
        isSyncing: true,
        progress: 100,
        error: null,
        start: mockStart,
        stop: mockStop,
      });
      const { rerender } = render(<AccountBalanceSummaryFooter account={mockAccount} />);

      // Simulate sync completion
      mockUseAleoPrivateSync.mockReturnValue({
        isSyncing: false,
        progress: 100,
        error: null,
        start: mockStart,
        stop: mockStop,
      });
      act(() => {
        rerender(<AccountBalanceSummaryFooter account={mockAccount} />);
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
});
