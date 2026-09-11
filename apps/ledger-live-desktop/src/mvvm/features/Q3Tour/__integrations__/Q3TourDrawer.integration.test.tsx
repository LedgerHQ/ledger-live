import React from "react";
import { fireEvent, render, screen, withFlagOverrides } from "tests/testSetup";
import { Q3TourDialog } from "../Drawer/Q3TourDialog";
import { useQ3TourDrawerViewModel } from "../Drawer/hooks/useQ3TourDrawerViewModel";

function TestHarness() {
  const {
    isDialogOpen,
    handleOpenDialog,
    closeDrawer,
    dismissDrawer,
    completeDrawer,
    onSlideChange,
    onContinueClick,
  } = useQ3TourDrawerViewModel();

  return (
    <>
      <button onClick={handleOpenDialog}>Open Q3 tour</button>
      <Q3TourDialog
        isOpen={isDialogOpen}
        onHeaderClose={closeDrawer}
        onDismiss={dismissDrawer}
        onContinueClick={onContinueClick}
        onComplete={completeDrawer}
        onSlideChange={onSlideChange}
      />
    </>
  );
}

const tourEnabledState = {
  ...withFlagOverrides({
    releaseTour: {
      enabled: true,
      params: { variant: "q3_a" },
    },
  }),
  settings: {
    hasSeenQ3Tour: false,
  },
};

const startSlideTransition = (title: string) => {
  const event = new Event("animationstart", { bubbles: true });
  Object.defineProperty(event, "animationName", { value: "slide-out-to-left" });
  fireEvent(screen.getByText(title), event);
};

describe("Q3Tour Drawer", () => {
  it("should navigate through all Q3 slides and complete the tour", async () => {
    const { user, store } = render(<TestHarness />, { initialState: tourEnabledState });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open Q3 tour" }));
    expect(screen.getByText("A quick tour of the latest")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Take a look" }));
    startSlideTransition("A quick tour of the latest");
    expect(screen.getByText("Say goodbye to long addresses")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Next" }));
    startSlideTransition("Say goodbye to long addresses");
    expect(screen.getByText("Say hello to Pay")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Next" }));
    startSlideTransition("Say hello to Pay");
    expect(screen.getByText("Keep your crypto, finance your projects")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "All caught up" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().settings.hasSeenQ3Tour).toBe(true);
  });

  it("should dismiss the Q3 tour with Escape and mark it as seen", async () => {
    const { user, store } = render(<TestHarness />, { initialState: tourEnabledState });

    await user.click(screen.getByRole("button", { name: "Open Q3 tour" }));
    await user.keyboard("{Escape}");

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().settings.hasSeenQ3Tour).toBe(true);
  });

  it("should not open when releaseTour is disabled", async () => {
    const { user } = render(<TestHarness />, {
      initialState: {
        ...withFlagOverrides({
          releaseTour: {
            enabled: false,
            params: { variant: "q3_a" },
          },
        }),
        settings: { hasSeenQ3Tour: false },
      },
    });

    await user.click(screen.getByRole("button", { name: "Open Q3 tour" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
  });
});
