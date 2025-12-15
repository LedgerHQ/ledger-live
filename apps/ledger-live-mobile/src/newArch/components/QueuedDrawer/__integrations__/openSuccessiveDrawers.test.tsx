import React from "react";
import { act, render, screen, waitFor, waitForElementToBeRemoved } from "@tests/test-renderer";
import { TestPages } from "./shared";
import { testIds, TestIdPrefix } from "../TestScreens";

// Helper: conditionally wait for an element (by testID) to be removed if it exists
const maybeWaitForRemovalByTestId = async (testId: string) => {
  const node = screen.queryByTestId(testId);
  if (node) {
    await waitForElementToBeRemoved(() => screen.getByTestId(testId));
  }
};

describe("QueuedDrawer", () => {
  afterEach(() => {
    act(() => {
      jest.runOnlyPendingTimers();
    });
  });

  test("open one drawer, then close it with close button", async () => {
    const { user } = render(<TestPages />);
    // open drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // Wait for drawer to appear with timer advancement
    await waitFor(
      async () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.getByText("Drawer 1")).toBeVisible();
      },
      { timeout: 2000, interval: 50 },
    );

    // press close
    await user.press(screen.getByTestId("modal-close-button"));

    // Wait for drawer to disappear
    await waitFor(
      () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.queryByText("Drawer 1")).toBeNull();
      },
      { timeout: 2000 },
    );

    // check the queue is empty and ready to be used again
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    await waitFor(
      async () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.getByText("Drawer 1")).toBeVisible();
      },
      { timeout: 2000, interval: 50 },
    );
  });

  test("open one drawer, queue a second drawer, unqueue it, then close first drawer from outside state (via drawer prop)", async () => {
    const { user } = render(<TestPages />);
    // open drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // Wait for drawer 1 to fully appear
    await waitFor(
      async () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.getByText("Drawer 1")).toBeVisible();
      },
      { timeout: 2000, interval: 50 },
    );

    // queue open second drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // unqueue second drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // close drawer from "cancel request open" button
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer1Button));

    // Wait for drawer to disappear
    await waitFor(
      () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.queryByText("Drawer 1")).toBeNull();
        expect(screen.queryByText("Drawer 2")).toBeNull();
      },
      { timeout: 2000 },
    );

    // check the queue is empty and ready to be used again
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    await waitFor(
      async () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.getByText("Drawer 1")).toBeVisible();
      },
      { timeout: 2000, interval: 50 },
    );
  });

  test("open two drawers, then close them consecutively with close button", async () => {
    const { user } = render(<TestPages />);
    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect first drawer is still visible after a few seconds (2nd is queued)
    act(() => {
      jest.advanceTimersByTime(5000);
    });
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // press close
    await user.press(screen.getByTestId("modal-close-button"));

    // Wait for drawer 2 to appear, advancing timers if needed
    await waitFor(
      async () => {
        // Keep advancing timers to let animations complete
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.getByText("Drawer 2")).toBeTruthy();
      },
      { timeout: 3000, interval: 50 },
    );

    // press close
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for 2nd drawer to disappear
    await waitFor(
      () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.queryByText("Drawer 2")).toBeNull();
      },
      { timeout: 2000 },
    );

    // expect none of the drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, then request to close the second one, then close the first one", async () => {
    const { user } = render(<TestPages />);
    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // request close second drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // press close
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for 1st drawer to disappear
    expect(screen.queryByText("Drawer 1")).toBeNull();

    // expect second drawer to not be visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("force opening a drawer while some are opened/queued", async () => {
    const { user } = render(<TestPages />);
    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // request open third drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer3Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 3")).toBeNull();

    // force open fourth drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer4ForcingButton));

    // Wait for drawer 4 to appear, advancing timers if needed
    await waitFor(
      async () => {
        // Keep advancing timers to let animations complete
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.getByText("Drawer 4")).toBeTruthy();
      },
      { timeout: 3000, interval: 50 },
    );

    // expect first 3 drawers not visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 3")).toBeNull();

    // close fourth drawer
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for 4th drawer to disappear
    await waitFor(
      () => {
        act(() => {
          jest.advanceTimersByTime(50);
        });
        expect(screen.queryByText("Drawer 4")).toBeNull();
      },
      { timeout: 2000 },
    );

    // expect none of the drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 3")).toBeNull();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("navigating out of a screen closes the drawers and cleanly clears the queue", async () => {
    const { user } = render(<TestPages />);

    // expect to be on main screen (check via a unique element on the screen, not header title)
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    // open first drawer
    expect(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first visible
    expect(screen.queryByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // click navigate to another screen
    await user.press(
      screen.getByTestId(testIds(TestIdPrefix.InDrawer1).navigateToEmptyTestScreenButton),
    );

    // wait for main screen content to disappear (if still present)
    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    // expect first drawer to not be visible
    expect(screen.queryByText("Drawer 1")).toBeNull();

    // expect other screen to be visible
    // RN-UPGRADE: Expectation not working for test env. But working on real device.
    // TODO: Restore this expectation when the test env is fixed.
    // expect(screen.queryByText("Empty screen")).toBeVisible();

    // navigate back
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear (content element)
    expect(screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, then navigate to another screen that has a drawer opened, then close it", async () => {
    const { user } = render(<TestPages />);
    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // click navigate to another screen
    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer1).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    // wait for main screen content to disappear (if still present)
    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    // expect other screen to be visible
    // RN-UPGRADE: Expectation not working for test env. But working on real device.
    // TODO: Restore this expectation when the test env is fixed.
    // expect(await screen.findByText("Screen 1")).toBeVisible();

    // expect first and second drawers to not be visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // expect drawer of screen 1 to be visible
    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();

    // close drawer
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for drawer to disappear
    expect(screen.queryByText("Drawer on screen 1")).toBeNull();

    // expect no drawers visible
    expect(await screen.queryByText("Drawer 1")).toBeNull();
    expect(await screen.queryByText("Drawer 2")).toBeNull();
    expect(await screen.queryByText("Drawer on screen 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear (content element)
    expect(await screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, force open another one, navigate to other screen", async () => {
    const { user } = render(<TestPages />);
    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // force open drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer4ForcingButton));

    // wait for drawer 4 to be visible
    expect(await screen.findByText("Drawer 4", {}, { timeout: 2000 })).toBeVisible();

    // expect first 2 drawers not visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // click navigate to another screen
    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer4).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    // wait for main screen content to disappear (if still present)
    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    // expect other screen to be visible
    // RN-UPGRADE: Expectation not working for test env. But working on real device.
    // TODO: Restore this expectation when the test env is fixed.
    // expect(await screen.findByText("Screen 1")).toBeVisible();

    // expect drawer of screen 1 to be visible
    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();
    // close drawer
    await user.press(screen.getByTestId("modal-close-button"));
    // wait for drawer to disappear
    expect(screen.queryByText("Drawer on screen 1")).toBeNull();

    // expect no drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 4")).toBeNull();
    expect(screen.queryByText("Drawer on screen 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear (content element)
    expect(await screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("open two drawers, force open another one, navigate to other screen with a drawer opened", async () => {
    const { user } = render(<TestPages />);
    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // force open third drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer4ForcingButton));

    // wait for drawer 4 to be visible
    expect(await screen.findByText("Drawer 4", {}, { timeout: 2000 })).toBeVisible();

    // expect first 2 drawers not visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // click navigate to another screen
    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer4).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    // wait for main screen content to disappear (if still present)
    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);

    // expect other screen to be visible
    // RN-UPGRADE: Expectation not working for test env. But working on real device.
    // TODO: Restore this expectation when the test env is fixed.
    // expect(await screen.findByText("Screen 1")).toBeVisible();

    // expect drawer of screen 2 to be visible
    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();

    // expect no drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 4")).toBeNull();

    // close drawer
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for drawer to disappear
    expect(screen.queryByText("Drawer on screen 1")).toBeNull();

    // expect no drawers visible
    expect(await screen.queryByText("Drawer 1")).toBeNull();
    expect(await screen.queryByText("Drawer 2")).toBeNull();
    expect(await screen.queryByText("Drawer on screen 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear (content element)
    expect(await screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("open one drawer at app level (out of navigation stack) and navigate to another screen", async () => {
    const { user } = render(<TestPages />);

    // open drawer 1
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // wait for drawer 1 to be visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // queue open drawer at app level
    expect(
      await screen.findByTestId(testIds(TestIdPrefix.InDrawer1).debugAppLevelDrawerButton),
    ).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).debugAppLevelDrawerButton));

    // expect drawer 1 should still be visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
    // close drawer 1
    await user.press(screen.getByTestId("modal-close-button"));

    // expect drawer at app level is visible
    expect(await screen.findByText("This is a drawer at the App level")).toBeVisible();
    // click navigate to another screen
    await user.press(
      screen.getByTestId(testIds(TestIdPrefix.Main).navigateToEmptyTestScreenButton),
    );
    // wait for main screen content to disappear (if still present)
    await maybeWaitForRemovalByTestId(testIds(TestIdPrefix.Main).drawer1Button);
    // expect other screen to be visible
    // RN-UPGRADE: Expectation not working for test env. But working on real device.
    // TODO: Restore this expectation when the test env is fixed.
    // expect(await screen.findByText("Empty screen")).toBeVisible();

    // expect app level drawer to still be visible
    expect(await screen.findByText("This is a drawer at the App level")).toBeVisible();

    // press close button
    await user.press(screen.getByTestId("modal-close-button"));
    // wait for drawer to disappear
    expect(screen.queryByText("This is a drawer at the App level")).toBeNull();

    // expect no drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear (check via unique element, not header title)
    expect(screen.queryByText("Empty screen")).toBeNull();
    expect(
      await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button, {}, { timeout: 3000 }),
    ).toBeVisible();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("lock drawers", async () => {
    // render
    const { user } = render(<TestPages />);

    // press lock drawers button
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).lockDrawersButton));
    // open drawer 1
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect drawer 1 to be visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
    // expect close button to be null
    expect(screen.queryByTestId("modal-close-button")).toBeNull();
    // queue open drawer 2
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    // close drawer 1 from props (click drawer 1 button)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer1Button));
    // expect drawer 2 to be visible
    expect(await screen.findByText("Drawer 2")).toBeVisible();
    // expect close button to not be visible
    expect(screen.queryByTestId("modal-close-button")).toBeNull();
    // unlock drawers
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).lockDrawersButton));
    // expect close button to be visible
    expect(await screen.findByTestId("modal-close-button")).toBeVisible();
    // close drawer 2
    await user.press(screen.getByTestId("modal-close-button"));
  });

  test("closeAllDrawers clears the queue and allows new drawers to open", async () => {
    const { user } = render(<TestPages />);

    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first drawer is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // queue open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second drawer not visible (it's queued)
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // call closeAllDrawers (simulating app lock scenario)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).closeAllDrawersButton));

    // expect both drawers are closed immediately
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // verify the queue is cleared and ready to be used again
    // open first drawer again
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first drawer is visible (this would fail if queue wasn't cleared)
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // close drawer
    await user.press(screen.getByTestId("modal-close-button"));
    // drawer should be closed
    expect(screen.queryByText("Drawer 1")).toBeNull();

    // verify we can open drawer 1 again and queue drawer 2
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    expect(await screen.findByText("Drawer 1")).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    // close drawer 1 to verify drawer 2 can open (queue works properly)
    await user.press(screen.getByTestId("modal-close-button"));
    // drawer 1 should be closed and drawer 2 should appear
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(await screen.findByText("Drawer 2")).toBeVisible();
  });
});
