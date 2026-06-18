import React from "react";
import { render, screen, waitFor, withFlagOverrides } from "tests/testSetup";
import { Q2TourDialog } from "../Drawer/Q2TourDialog";
import { useQ2TourDrawerViewModel } from "../Drawer/hooks/useQ2TourDrawerViewModel";

function TestHarness({ isOnPortfolioPage = false }: { isOnPortfolioPage?: boolean }) {
  const {
    isDialogOpen,
    handleOpenDialog,
    closeDrawer,
    dismissDrawer,
    completeDrawer,
    onSlideChange,
    onContinueClick,
  } = useQ2TourDrawerViewModel({
    isOnPortfolioPage,
  });

  return (
    <div>
      <button data-testid="open-dialog" onClick={handleOpenDialog}>
        Open
      </button>
      <Q2TourDialog
        isOpen={isDialogOpen}
        onHeaderClose={closeDrawer}
        onDismiss={dismissDrawer}
        onContinueClick={onContinueClick}
        onComplete={completeDrawer}
        onSlideChange={onSlideChange}
      />
    </div>
  );
}

const tourEnabledOverrides = {
  lwdWallet40: {
    enabled: true,
    params: { q2Tour: true },
  },
};

function getTourTestInitialState(overrides?: {
  hasSeenQ2Tour?: boolean;
  hasCompletedOnboarding?: boolean;
  featureFlagOverrides?: typeof tourEnabledOverrides;
}) {
  return {
    ...withFlagOverrides(overrides?.featureFlagOverrides ?? tourEnabledOverrides),
    settings: {
      hasCompletedOnboarding: overrides?.hasCompletedOnboarding ?? true,
      hasSeenQ2Tour: overrides?.hasSeenQ2Tour ?? false,
    },
  };
}

describe("Q2Tour Drawer", () => {
  it("should open dialog when tour is enabled and hasSeen is false", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getTourTestInitialState(),
    });

    await user.click(screen.getByTestId("open-dialog"));

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });
  });

  it("should not open dialog when hasSeen is true", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getTourTestInitialState({ hasSeenQ2Tour: true }),
    });

    await user.click(screen.getByTestId("open-dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not open dialog when tour is disabled (q2Tour false)", async () => {
    const { user } = render(<TestHarness />, {
      initialState: getTourTestInitialState({
        featureFlagOverrides: {
          lwdWallet40: { enabled: true, params: { q2Tour: false } },
        },
      }),
    });

    await user.click(screen.getByTestId("open-dialog"));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should auto-open dialog on Portfolio when tour enabled, onboarding complete, and not seen", async () => {
    render(<TestHarness isOnPortfolioPage />, {
      initialState: getTourTestInitialState(),
    });

    await waitFor(() => {
      expect(screen.getByRole("dialog")).toBeVisible();
    });
  });

  it("should not auto-open dialog when onboarding is incomplete", async () => {
    render(<TestHarness isOnPortfolioPage />, {
      initialState: getTourTestInitialState({ hasCompletedOnboarding: false }),
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });

  it("should not auto-open dialog when not on Portfolio page", async () => {
    render(<TestHarness isOnPortfolioPage={false} />, {
      initialState: getTourTestInitialState(),
    });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
