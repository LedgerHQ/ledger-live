import React from "react";
import { render, screen, waitFor } from "tests/testSetup";
import { WalletV4TourDialog } from "../Drawer/WalletV4TourDialog";
import { useWalletV4TourDrawerViewModel } from "../Drawer/hooks/useWalletV4TourDrawerViewModel";

function TestHarness({ isOnPortfolioPage = false }: { isOnPortfolioPage?: boolean }) {
  const { isDialogOpen, handleOpenDialog, closeDrawer, completeDrawer, onSlideChange } =
    useWalletV4TourDrawerViewModel({
      isOnPortfolioPage,
    });

  return (
    <div>
      <button data-testid="open-dialog" onClick={handleOpenDialog}>
        Open
      </button>
      <WalletV4TourDialog
        isOpen={isDialogOpen}
        onClose={closeDrawer}
        onComplete={completeDrawer}
        onSlideChange={onSlideChange}
      />
    </div>
  );
}

const tourEnabledOverrides = {
  lwdWallet40: {
    enabled: true,
    params: { tour: true },
  },
};

function getTourTestInitialState(overrides?: {
  hasSeenWalletV4Tour?: boolean;
  overriddenFeatureFlags?: typeof tourEnabledOverrides;
}) {
  return {
    settings: {
      hasSeenWalletV4Tour: false,
      overriddenFeatureFlags: tourEnabledOverrides,
      ...overrides,
    },
  };
}

describe("WalletV4Tour Drawer", () => {
  it("should open dialog when tour is enabled and hasSeenWalletV4Tour is false", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getTourTestInitialState(),
    });

    await user.click(screen.getByTestId("open-dialog"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should not open dialog when hasSeenWalletV4Tour is true", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getTourTestInitialState({ hasSeenWalletV4Tour: true }),
    });

    await user.click(screen.getByTestId("open-dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not open dialog when tour is disabled (lwdWallet40.tour false)", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getTourTestInitialState({
        overriddenFeatureFlags: {
          lwdWallet40: { enabled: true, params: { tour: false } },
        },
      }),
    });

    await user.click(screen.getByTestId("open-dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should auto-open dialog on Portfolio when tour enabled and not seen", async () => {
    render(<TestHarness isOnPortfolioPage />, {
      initialState: getTourTestInitialState(),
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeInTheDocument();
    });
  });

  it("should not auto-open dialog when not on Portfolio page", async () => {
    render(<TestHarness isOnPortfolioPage={false} />, {
      initialState: getTourTestInitialState(),
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
