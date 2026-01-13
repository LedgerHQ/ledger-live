import React from "react";
import { render, screen } from "tests/testSetup";
import SyncStep from "../components/SyncStep";
import useLedgerSyncEntryPointViewModel from "LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

jest.mock("LLD/features/LedgerSyncEntryPoints/useLedgerSyncEntryPointViewModel", () => jest.fn());

const mockOpenSyncDrawer = jest.fn();

describe("SyncStep", () => {
  beforeEach(async () => {
    mockOpenSyncDrawer.mockReset();
    jest.mocked(useLedgerSyncEntryPointViewModel).mockReturnValue({
      openDrawer: mockOpenSyncDrawer,
      closeDrawer: jest.fn(),
      shouldDisplayEntryPoint: true,
      onClickEntryPoint: jest.fn(),
      entryPointComponent: () => <></>,
      page: AnalyticsPage.Onboarding,
      onPress: jest.fn(),
    });
  });

  it("should open sync drawer on sync button press", async () => {
    const { user } = render(
      <SyncStep
        handleContinue={jest.fn()}
        isLedgerSyncActive={false}
        seedConfiguration="new_seed"
        deviceName="stax"
      />,
    );

    const syncButton = screen.getByTestId("onboarding-sync");

    expect(syncButton).toBeVisible();

    await user.click(syncButton);

    expect(mockOpenSyncDrawer).toHaveBeenCalled();
  });

  it("should open skip sync drawer on skip button press", async () => {
    const { user } = render(
      <>
        <div id="modals"></div>
        <SyncStep
          handleContinue={jest.fn()}
          isLedgerSyncActive={false}
          seedConfiguration="new_seed"
          deviceName="stax"
        />
      </>,
    );

    const skipButton = screen.getByTestId("skip-cta-button");

    expect(skipButton).toBeVisible();

    await user.click(skipButton);

    const skipDrawer = screen.getByTestId("skip-sync-drawer");
    expect(skipDrawer).toBeInTheDocument();
  });
});
