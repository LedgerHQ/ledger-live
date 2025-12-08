import React from "react";
import { LONG_TIMEOUT, act, render, screen, waitForElementToBeRemoved } from "@tests/test-renderer";
import { TestPages } from "./shared";
import { testIds, TestIdPrefix } from "../TestScreens";

jest.setTimeout(LONG_TIMEOUT);

const flushMicrotasksAndTimers = async () => {
  await act(async () => {
    await Promise.resolve();
  });
  act(() => {
    jest.advanceTimersByTime(500);
  });
};

const maybeWaitForRemovalByTestId = async (testId: string) => {
  const node = screen.queryByTestId(testId);
  if (node) {
    await waitForElementToBeRemoved(() => screen.getByTestId(testId));
  }
};

describe("QueuedDrawer", () => {
  afterEach(() => {
    act(() => {
      jest.runAllTimers();
    });
  });

  test("open one drawer, then close it with close button", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 1")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("open one drawer, queue a second drawer, unqueue it, then close first drawer from outside state (via drawer prop)", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, then close them consecutively with close button", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(screen.getByText("Drawer 1")).toBeVisible();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 2")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 1")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, then request to close the second one, then close the first one", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("force opening a drawer while some are opened/queued", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer3Button));
    expect(screen.queryByText("Drawer 3")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer4ForcingButton));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 4")).toBeVisible();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 3")).toBeNull();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 4")).toBeNull();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 3")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("navigating out of a screen closes the drawers and cleanly clears the queue", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(
      screen.getByTestId(testIds(TestIdPrefix.InDrawer1).navigateToEmptyTestScreenButton),
    );

    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    expect(screen.queryByText("Drawer 1")).toBeNull();

    await user.press(screen.getByTestId("navigate-back-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Screen 1")).toBeNull();
    expect(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, then navigate to another screen that has a drawer opened, then close it", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer1).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer on screen 1")).toBeNull();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId("navigate-back-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Screen 1")).toBeNull();
    expect(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, force open another one, navigate to other screen", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer4ForcingButton));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 4")).toBeVisible();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer4).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer on screen 1")).toBeNull();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 4")).toBeNull();

    await user.press(screen.getByTestId("navigate-back-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Screen 1")).toBeNull();
    expect(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, force open another one, navigate to other screen with a drawer opened", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer4ForcingButton));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 4")).toBeVisible();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer4).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 4")).toBeNull();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer on screen 1")).toBeNull();
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId("navigate-back-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Screen 1")).toBeNull();
    expect(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("open one drawer at app level (out of navigation stack) and navigate to another screen", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).debugAppLevelDrawerButton));
    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("This is a drawer at the App level")).toBeVisible();

    await user.press(
      screen.getByTestId(testIds(TestIdPrefix.Main).navigateToEmptyTestScreenButton),
    );

    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    expect(screen.getByText("This is a drawer at the App level")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("This is a drawer at the App level")).toBeNull();
    expect(screen.queryByText("Drawer 1")).toBeNull();

    await user.press(screen.getByTestId("navigate-back-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Empty screen")).toBeNull();
    expect(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
  });

  test("lock drawers", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).lockDrawersButton));

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();
    expect(screen.queryByTestId("modal-close-button")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 2")).toBeVisible();
    expect(screen.queryByTestId("modal-close-button")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).lockDrawersButton));
    await flushMicrotasksAndTimers();

    expect(screen.getByTestId("modal-close-button")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();
  });

  test("closeAllDrawers clears the queue and allows new drawers to open", async () => {
    const { user } = render(<TestPages />);

    await user.press(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).closeAllDrawersButton));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 1")).toBeNull();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    await flushMicrotasksAndTimers();

    expect(screen.getByText("Drawer 1")).toBeVisible();

    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    await user.press(screen.getByTestId("modal-close-button"));
    await flushMicrotasksAndTimers();

    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.getByText("Drawer 2")).toBeVisible();
  });
});
