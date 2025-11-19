import React from "react";
import { render, screen } from "tests/testSetup";
import LedgerSyncBanner from "../ledgerSyncBanner";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";

const mockOpenDrawer = jest.fn();
const mockOnClickEntryPoint = jest.fn();
const mockCloseDrawer = jest.fn();

jest.mock("LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel", () => ({
  __esModule: true,
  default: jest.fn(),
}));

const mockUseLedgerSyncEntryPointViewModel = jest.mocked(useLedgerSyncEntryPointViewModel);

describe("LedgerSyncBanner", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockUseLedgerSyncEntryPointViewModel.mockReturnValue({
      shouldDisplayEntryPoint: true,
      onClickEntryPoint: mockOnClickEntryPoint,
      openDrawer: mockOpenDrawer,
      closeDrawer: mockCloseDrawer,
      entryPointComponent: jest.fn(),
      page: AnalyticsPage.Accounts,
      onPress: undefined,
    });
  });

  it("should not render when shouldDisplayEntryPoint is false", () => {
    mockUseLedgerSyncEntryPointViewModel.mockReturnValue({
      shouldDisplayEntryPoint: false,
      onClickEntryPoint: mockOnClickEntryPoint,
      openDrawer: mockOpenDrawer,
      closeDrawer: jest.fn(),
      entryPointComponent: jest.fn(),
      page: AnalyticsPage.Accounts,
      onPress: undefined,
    });

    render(<LedgerSyncBanner />);

    expect(screen.queryByText(/Your wallet isn't synced/)).not.toBeInTheDocument();
  });

  it("should render banner with correct content when shouldDisplayEntryPoint is true and open drawer when button is clicked", async () => {
    const { user } = render(<LedgerSyncBanner />);

    expect(screen.getByText(/Your wallet isn't synced/)).toBeInTheDocument();
    const button = screen.getByRole("button", { name: /Sync my wallet/ });
    await user.click(button);

    expect(mockOnClickEntryPoint).toHaveBeenCalledTimes(1);
    expect(mockOpenDrawer).toHaveBeenCalledTimes(1);
  });
});
