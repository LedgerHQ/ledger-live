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
  });

  test("open one drawer, then close it from outside state (via drawer prop)", async () => {
    const { user } = render(<TestPages />);
    // open drawer
    expect(await screen.findByTestId(testIds(TestIdPrefix.Main).drawer1Button)).toBeVisible();
    await user.press(screen.getByTestId(testIds(TestIdPrefix.Main).drawer1Button));
    // expect it's visible
    expect(await screen.findByText("Drawer 1")).toBeVisible();
    // close drawer from "cancel request open" button
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer1Button));
    // expect it's not visible
    await waitForElementToBeRemoved(() => screen.getByText("Drawer 1"));
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
  });

  test("open two drawers, then force open a third one, then close it", async () => {
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
    await user.press(screen.getByTestId(testIds(TestIdPrefix.InDrawer1).drawer4Button));

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
  });

  test("open one drawer, then navigate to another screen", async () => {
    // open first drawer
    // expect first visible
    // click navigate to another screen
    // expect other screen to be visible
    // expect first drawer to not be visible
  });

  test("open two drawers, then navigate to another screen", async () => {
    // ... first steps
    // expect no drawer visible
  });

  test("open two drawers, then navigate to another screen that has a drawer opened, then close it", async () => {
    // ... first steps
    // expect drawer of 2nd screen visible
    // expect drawers of first screen not vislbe
    // close drawer
    // wait drawer content not visible
  });

  test("open two drawers, force open another one, navigate to other screen", async () => {
    //
  });

  test("open two drawers, force open another one, navigate to other screen with a drawer opened", async () => {
    //
  });

  test("open one drawer at app level (out of navigation stack) and navigate to another screen", async () => {
    //
  });

  test("lock drawers", async () => {});
});
