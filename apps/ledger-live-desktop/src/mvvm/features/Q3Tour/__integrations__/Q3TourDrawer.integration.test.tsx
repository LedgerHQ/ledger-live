import React from "react";
import { fireEvent, render, screen, withFlagOverrides } from "tests/testSetup";
import { Q3TourDialog } from "../Drawer/Q3TourDialog";
import { useQ3TourDrawerViewModel } from "../Drawer/hooks/useQ3TourDrawerViewModel";

function TestHarness() {
  const {
    tour,
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
        tour={tour}
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

const getTourEnabledState = (variant: "q3_a" | "q3_b" | "q3_b2" = "q3_a") => ({
  ...withFlagOverrides({
    releaseTour: {
      enabled: true,
      params: { variant },
    },
  }),
  settings: {
    hasSeenQ3Tour: false,
  },
});

const startSlideTransition = (title: string) => {
  const event = new Event("animationstart", { bubbles: true });
  Object.defineProperty(event, "animationName", { value: "slide-out-to-left" });
  fireEvent(screen.getByText(title), event);
};

describe("Q3Tour Drawer", () => {
  it("should show Contacts and Pay with card in q3_a", async () => {
    const { user, store } = render(<TestHarness />, { initialState: getTourEnabledState() });

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();

    await user.click(screen.getByRole("button", { name: "Open Q3 tour" }));
    expect(screen.getByText("A quick tour of the latest")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Take a look" }));
    startSlideTransition("A quick tour of the latest");
    expect(screen.getByText("Say goodbye to long addresses")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Next" }));
    startSlideTransition("Say goodbye to long addresses");
    expect(screen.getByText("Say hello to Pay")).toBeVisible();
    expect(
      screen.getByText(
        "Pay contacts, request money, and get cashback with crypto card. Now, all via one tab.",
      ),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Next" }));
    startSlideTransition("Say hello to Pay");
    expect(screen.getByText("Keep your crypto, finance your projects")).toBeVisible();

    await user.click(screen.getByRole("button", { name: "All caught up" }));

    expect(screen.queryByRole("dialog")).not.toBeInTheDocument();
    expect(store.getState().settings.hasSeenQ3Tour).toBe(true);
  });

  it("should show Contacts B and omit Pay in q3_b", async () => {
    const { user } = render(<TestHarness />, { initialState: getTourEnabledState("q3_b") });

    await user.click(screen.getByRole("button", { name: "Open Q3 tour" }));
    await user.click(screen.getByRole("button", { name: "Take a look" }));
    startSlideTransition("A quick tour of the latest");

    expect(screen.getByText("Say hello to Contacts")).toBeVisible();
    expect(
      screen.getByText(
        "Say goodbye to long addresses. Save wallet addresses with names. Easy to find, easy to send.",
      ),
    ).toBeVisible();

    await user.click(screen.getByRole("button", { name: "Next" }));
    startSlideTransition("Say hello to Contacts");

    expect(screen.getByText("Keep your crypto, finance your projects")).toBeVisible();
    expect(screen.queryByText("Say hello to Pay")).not.toBeInTheDocument();
  });

  it("should show Pay without card in q3_b2", async () => {
    const { user } = render(<TestHarness />, { initialState: getTourEnabledState("q3_b2") });

    await user.click(screen.getByRole("button", { name: "Open Q3 tour" }));
    await user.click(screen.getByRole("button", { name: "Take a look" }));
    startSlideTransition("A quick tour of the latest");
    await user.click(screen.getByRole("button", { name: "Next" }));
    startSlideTransition("Say goodbye to long addresses");

    expect(screen.getByText("Say hello to Pay")).toBeVisible();
    expect(screen.getByText("Pay contacts and request money, all via one tab.")).toBeVisible();
    expect(
      screen.queryByText(
        "Pay contacts, request money, and get cashback with crypto card. Now, all via one tab.",
      ),
    ).not.toBeInTheDocument();
  });

  it("should dismiss the Q3 tour with Escape and mark it as seen", async () => {
    const { user, store } = render(<TestHarness />, { initialState: getTourEnabledState() });

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
