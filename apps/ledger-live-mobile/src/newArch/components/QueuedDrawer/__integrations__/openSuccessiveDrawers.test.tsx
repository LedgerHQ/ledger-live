import React from "react";
import { screen, waitForElementToBeRemoved } from "@testing-library/react-native";
import { act, render, cleanup } from "@tests/test-renderer";
import { TestPages } from "./shared";
import { testIds, TestIdPrefix } from "../TestScreens";

jest.useFakeTimers();

describe("QueuedDrawer", () => {
  afterEach(cleanup);
  test("open one drawer, then close it with close button", async () => {
    const { user } = render(<TestPages />);
    // open drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect it's visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
    // press close
    await user.press(screen.getByTestId("modal-close-button"));
    // expect it's not visible
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
  });

  test("open one drawer, queue a second drawer, unqueue it, then close first drawer from outside state (via drawer prop)", async () => {
    const { user } = render(<TestPages />);
    // open drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect it's visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // queue open second drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));
    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();
    // unqueue second drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // close drawer from "cancel request open" button
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer1Button));
    // expect it's not visible
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // check the queue is empty and ready to be used again
    // open first drawer
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect first is visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
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

    // wait for 1st drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));

    // expect second drawer to be visible
    expect(await screen.findByText("Drawer 2")).toBeVisible();

    // press close
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for 2nd drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 2"));
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
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));

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

    // wait for 1st drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));

    // expect third visible
    expect(await screen.findByText("Drawer 4")).toBeVisible();

    // expect first 3 drawers not visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 3")).toBeNull();

    // close fourth drawer
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for 4th drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 4"));

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

    // expect to be on main screen
    expect(await screen.findByText("Main screen")).toBeVisible();
    // open first drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));

    // expect first visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();

    // request open second drawer (button in first drawer)
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer2Button));

    // expect second not visible
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // click navigate to another screen
    await user.press(
      screen.getByTestId(testIds(TestIdPrefix.InDrawer1).navigateToEmptyTestScreenButton),
    );

    // wait for main screen to disappear
    waitForElementToBeRemoved(() => screen.getByText("Main screen"));

    // expect first drawer to not be visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    // expect other screen to be visible
    expect(await screen.findByText("Empty screen")).toBeVisible();

    // navigate back
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear
    expect(await screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByText("Main screen")).toBeVisible();

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

    // wait for main screen to disappear
    waitForElementToBeRemoved(() => screen.getByText("Main screen"));

    // expect other screen to be visible
    expect(await screen.findByText("Screen 1")).toBeVisible();

    // expect first and second drawers to not be visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // expect drawer of screen 1 to be visible
    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();

    // close drawer
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer on screen 1"));

    // expect no drawers visible
    expect(await screen.queryByText("Drawer 1")).toBeNull();
    expect(await screen.queryByText("Drawer 2")).toBeNull();
    expect(await screen.queryByText("Drawer on screen 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear
    expect(await screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByText("Main screen")).toBeVisible();

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

    // wait for 1st drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));

    // expect forced drawer visible
    expect(await screen.findByText("Drawer 4")).toBeVisible();

    // expect first 2 drawers not visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // click navigate to another screen
    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer4).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    // wait for main screen to disappear
    waitForElementToBeRemoved(() => screen.getByText("Main screen"));

    // expect other screen to be visible
    expect(await screen.findByText("Screen 1")).toBeVisible();

    // expect drawer of screen 1 to be visible
    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();
    // close drawer
    await user.press(screen.getByTestId("modal-close-button"));
    // wait for drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer on screen 1"));

    // expect no drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 4")).toBeNull();
    expect(screen.queryByText("Drawer on screen 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear
    expect(await screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByText("Main screen")).toBeVisible();

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

    // wait for 1st drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));

    // expect third visible
    expect(await screen.findByText("Drawer 4")).toBeVisible();

    // expect first 2 drawers not visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();

    // click navigate to another screen
    await user.press(
      screen.getByTestId(
        testIds(TestIdPrefix.InDrawer4).navigateToTestScreenWithDrawerRequestingToBeOpenedButton,
      ),
    );

    // wait for main screen to disappear
    waitForElementToBeRemoved(() => screen.getByText("Main screen"));

    // expect other screen to be visible
    expect(await screen.findByText("Screen 1")).toBeVisible();

    // expect drawer of screen 2 to be visible
    expect(await screen.findByText("Drawer on screen 1")).toBeVisible();

    // expect no drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();
    expect(screen.queryByText("Drawer 2")).toBeNull();
    expect(screen.queryByText("Drawer 4")).toBeNull();

    // close drawer
    await user.press(screen.getByTestId("modal-close-button"));

    // wait for drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("Drawer on screen 1"));

    // expect no drawers visible
    expect(await screen.queryByText("Drawer 1")).toBeNull();
    expect(await screen.queryByText("Drawer 2")).toBeNull();
    expect(await screen.queryByText("Drawer on screen 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear
    expect(await screen.queryByText("Screen 1")).toBeNull();
    expect(await screen.findByText("Main screen")).toBeVisible();

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
    // wait for main screen to disappear
    waitForElementToBeRemoved(() => screen.getByText("Main screen"));
    // expect other screen to be visible
    expect(await screen.findByText("Empty screen")).toBeVisible();
    // expect app level drawer to still be visible
    expect(await screen.findByText("This is a drawer at the App level")).toBeVisible();

    // press close button
    await user.press(screen.getByTestId("modal-close-button"));
    // wait for drawer to disappear
    await waitForElementToBeRemoved(() => screen.getByText("This is a drawer at the App level"));

    // expect no drawers visible
    expect(screen.queryByText("Drawer 1")).toBeNull();

    // navigate back to main screen
    await user.press(screen.getByTestId("navigate-back-button"));
    // wait for main screen to appear
    expect(await screen.queryByText("Empty screen")).toBeNull();
    expect(await screen.findByText("Main screen")).toBeVisible();

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
});
