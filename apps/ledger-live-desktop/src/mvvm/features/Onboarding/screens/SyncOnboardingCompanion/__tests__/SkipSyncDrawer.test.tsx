import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { Button } from "@ledgerhq/react-ui";
import SkipSyncDrawer from "../components/SkipSyncDrawer";
import { setSkipDrawerVisibility } from "~/renderer/reducers/onboarding";
import { useDispatch } from "LLD/hooks/redux";

const mockHandleSkip = jest.fn();
const mockHandleSync = jest.fn();

const Setup = () => {
  const dispatch = useDispatch();
  return (
    <>
      <div id="modals"></div>
      <SkipSyncDrawer
        onSkip={mockHandleSkip}
        handleSync={mockHandleSync}
        seedConfiguration="new_seed"
        deviceName="stax"
      />
      <Button data-testid="drawer-button" onClick={() => dispatch(setSkipDrawerVisibility(true))} />
    </>
  );
};

describe("Skip Sync Drawer", () => {
  beforeEach(async () => {
    mockHandleSkip.mockReset();
    mockHandleSync.mockReset();
  });

  it("should skip when skip confirmed", async () => {
    const { user } = render(<Setup />);

    await user.click(screen.getByTestId("drawer-button"));

    await waitFor(() => {
      const skipDrawer = screen.getByTestId("skip-sync-drawer");
      expect(skipDrawer).toBeInTheDocument();
    });

    const skipButton = screen.getByTestId("onboarding-sync-skip-confirmSkip");

    expect(skipButton).toBeVisible();

    await user.click(skipButton);

    expect(mockHandleSkip).toHaveBeenCalled();
  });

  it("should start sync when no skip button press", async () => {
    const { user } = render(<Setup />);

    await user.click(screen.getByTestId("drawer-button"));

    await waitFor(() => {
      const skipDrawer = screen.getByTestId("skip-sync-drawer");
      expect(skipDrawer).toBeInTheDocument();
    });

    const syncButton = screen.getByTestId("onboarding-sync-skip-doSync");

    expect(syncButton).toBeVisible();

    await user.click(syncButton);

    expect(mockHandleSync).toHaveBeenCalled();
  });
});
