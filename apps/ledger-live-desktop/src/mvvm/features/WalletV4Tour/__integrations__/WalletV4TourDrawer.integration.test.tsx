import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { WalletV4TourDialog } from "../Drawer/WalletV4TourDialog";
import { useWalletV4TourDrawerViewModel } from "../Drawer/hooks/useWalletV4TourDrawerViewModel";

function TestHarness() {
  const { isDialogOpen, handleOpenDialog, handleCloseDialog } = useWalletV4TourDrawerViewModel();

  return (
    <div>
      <button data-testid="open-dialog" onClick={handleOpenDialog}>
        Open
      </button>
      <WalletV4TourDialog isOpen={isDialogOpen} onClose={handleCloseDialog} />
    </div>
  );
}

describe("WalletV4Tour Drawer", () => {
  it("should open dialog when hasSeenWalletV4Tour is false", async () => {
    const { user } = render(<TestHarness />, {
      initialState: { settings: { hasSeenWalletV4Tour: false } },
    });

    await user.click(screen.getByTestId("open-dialog"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should not open dialog when hasSeenWalletV4Tour is true", async () => {
    const { user } = render(<TestHarness />, {
      initialState: { settings: { hasSeenWalletV4Tour: true } },
    });

    await user.click(screen.getByTestId("open-dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
