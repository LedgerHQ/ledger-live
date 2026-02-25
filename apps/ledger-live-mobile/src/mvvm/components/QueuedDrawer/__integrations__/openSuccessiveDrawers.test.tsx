import React from "react";
import { render, LONG_TIMEOUT, waitForElementToBeRemoved } from "@tests/test-renderer";
import { TestPages } from "./shared";
import { TestIdPrefix } from "../TestScreens";
import { testIds } from "../TestScreens";

describe("QueuedDrawer", () => {
  // this test is really slow to cold start, so we need to increase the timeout
  // we need to find out why and fix it
  jest.setTimeout(LONG_TIMEOUT * 3);

  beforeEach(() => {
    jest.useRealTimers();
  });

  afterEach(() => {
    jest.clearAllTimers();
    jest.useFakeTimers();
  });

  const mainTestIds = testIds(TestIdPrefix.Main);
  const inDrawer1TestIds = testIds(TestIdPrefix.InDrawer1);
  const inDrawer4TestIds = testIds(TestIdPrefix.InDrawer4);
  const modalCloseButtonId = "modal-close-button";
  const navigateBackButtonId = "navigate-back-button";

  const drawer1Text = "Drawer 1";
  const drawer2Text = "Drawer 2";
  const drawer3Text = "Drawer 3";
  const drawer4Text = "Drawer 4";
  const drawerOnScreen1Text = "Drawer on screen 1";
  const appLevelDrawerText = "This is a drawer at the App level";
  const emptyScreenText = "Empty screen";
  const screen1Text = "Screen 1";

  const setupTest = () => {
    const renderResult = render(<TestPages />);
    const { getByTestId } = renderResult;

    const elements = {
      mainDrawer1Button: () => getByTestId(mainTestIds.drawer1Button),
      inDrawer1Drawer2Button: () => getByTestId(inDrawer1TestIds.drawer2Button),
      inDrawer1Drawer3Button: () => getByTestId(inDrawer1TestIds.drawer3Button),
      inDrawer1Drawer4ForcingButton: () => getByTestId(inDrawer1TestIds.drawer4ForcingButton),
      inDrawer1Drawer1Button: () => getByTestId(inDrawer1TestIds.drawer1Button),
      inDrawer1AppLevelButton: () => getByTestId(inDrawer1TestIds.debugAppLevelDrawerButton),
      inDrawer1NavigateToEmptyButton: () =>
        getByTestId(inDrawer1TestIds.navigateToEmptyTestScreenButton),
      inDrawer1NavigateToScreen1Button: () =>
        getByTestId(inDrawer1TestIds.navigateToTestScreenWithDrawerRequestingToBeOpenedButton),
      inDrawer4NavigateToScreen1Button: () =>
        getByTestId(inDrawer4TestIds.navigateToTestScreenWithDrawerRequestingToBeOpenedButton),
      closeButton: () => getByTestId(modalCloseButtonId),
      navigateToEmptyButton: () => getByTestId(mainTestIds.navigateToEmptyTestScreenButton),
      navigateBackButton: () => getByTestId(navigateBackButtonId),
      lockDrawersButton: () => getByTestId(mainTestIds.lockDrawersButton),
      closeAllDrawersButton: () => getByTestId(mainTestIds.closeAllDrawersButton),
    };

    const helpers = {
      openDrawer1: async () => {
        expect(elements.mainDrawer1Button()).toBeVisible();
        await renderResult.user.press(elements.mainDrawer1Button());
        expect(await renderResult.findByText(drawer1Text)).toBeVisible();
      },
      expectAllDrawersClosed: () => {
        expect(renderResult.queryByText(drawer1Text)).toBeNull();
        expect(renderResult.queryByText(drawer2Text)).toBeNull();
        expect(renderResult.queryByText(drawer3Text)).toBeNull();
        expect(renderResult.queryByText(drawer4Text)).toBeNull();
        expect(renderResult.queryByText(drawerOnScreen1Text)).toBeNull();
      },
      expectDrawersClosed: (...drawerTexts: string[]) => {
        drawerTexts.forEach(text => {
          expect(renderResult.queryByText(text)).toBeNull();
        });
      },
      waitForMainScreenDisappear: async () => {
        const mainButton = renderResult.queryByTestId(mainTestIds.drawer1Button);
        if (mainButton) {
          await waitForElementToBeRemoved(() =>
            renderResult.getByTestId(mainTestIds.drawer1Button),
          );
        }
      },
      expectBackOnMainScreen: async () => {
        expect(renderResult.queryByText(screen1Text)).toBeNull();
        expect(await renderResult.findByTestId(mainTestIds.drawer1Button)).toBeVisible();
      },
    };

    return {
      ...renderResult,
      elements,
      helpers,
    };
  };

  it("opens one drawer, then close it with close button", async () => {
    const { user, elements, helpers, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.closeButton());
    expect(queryByText(drawer1Text)).toBeNull();
    await helpers.openDrawer1();
  });

  it("opens one drawer, queue a second drawer, unqueue it, then close first drawer from outside state (via drawer prop)", async () => {
    const { user, elements, helpers, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.inDrawer1Drawer2Button());
    await user.press(elements.inDrawer1Drawer1Button());
    helpers.expectAllDrawersClosed();
    await helpers.openDrawer1();
  });

  it("opens two drawers, then close them consecutively with close button", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(await findByText(drawer1Text)).toBeVisible();
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.closeButton());
    expect(await findByText(drawer2Text)).toBeVisible();
    await user.press(elements.closeButton());
    helpers.expectAllDrawersClosed();
    await helpers.openDrawer1();
  });

  it("opens two drawers, then request to close the second one, then close the first one", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.closeButton());
    expect(queryByText(drawer1Text)).toBeNull();
    expect(await findByText(drawer2Text)).toBeVisible();
    await user.press(elements.closeButton());
    helpers.expectAllDrawersClosed();
    await helpers.openDrawer1();
  });

  it("forces opening a drawer while some are opened/queued", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.inDrawer1Drawer3Button());
    expect(queryByText(drawer3Text)).toBeNull();
    await user.press(elements.inDrawer1Drawer4ForcingButton());
    expect(await findByText(drawer4Text)).toBeVisible();
    helpers.expectDrawersClosed(drawer1Text, drawer2Text, drawer3Text);
    await user.press(elements.closeButton());
    expect(queryByText(drawer4Text)).toBeNull();
    helpers.expectAllDrawersClosed();
    await helpers.openDrawer1();
  });

  it("opens one drawer at app level (out of navigation stack) and navigate to another screen", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    expect(elements.inDrawer1AppLevelButton()).toBeVisible();
    await user.press(elements.inDrawer1AppLevelButton());
    expect(await findByText(drawer1Text)).toBeVisible();
    await user.press(elements.closeButton());
    expect(await findByText(appLevelDrawerText)).toBeVisible();
    await user.press(elements.closeButton());
    expect(queryByText(appLevelDrawerText)).toBeNull();
    await user.press(elements.navigateToEmptyButton());
    helpers.expectAllDrawersClosed();
    await user.press(elements.navigateBackButton());
    expect(queryByText(emptyScreenText)).toBeNull();
    expect(elements.mainDrawer1Button()).toBeVisible();
    await helpers.openDrawer1();
  });

  it("locks drawers", async () => {
    const { user, elements, findByText, queryByTestId } = setupTest();

    await user.press(elements.lockDrawersButton());
    await user.press(elements.mainDrawer1Button());
    expect(await findByText(drawer1Text)).toBeVisible();
    expect(queryByTestId(modalCloseButtonId)).toBeNull();
    await user.press(elements.inDrawer1Drawer2Button());
    await user.press(elements.inDrawer1Drawer1Button());
    expect(await findByText(drawer2Text)).toBeVisible();
    expect(queryByTestId(modalCloseButtonId)).toBeNull();
    await user.press(elements.lockDrawersButton());
    expect(queryByTestId(modalCloseButtonId)).toBeVisible();
    await user.press(elements.closeButton());
  });

  it("closes all drawers and allows new drawers to open", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.closeAllDrawersButton());
    helpers.expectAllDrawersClosed();
    await helpers.openDrawer1();
    await user.press(elements.closeButton());
    expect(queryByText(drawer1Text)).toBeNull();
    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    await user.press(elements.closeButton());
    expect(queryByText(drawer1Text)).toBeNull();
    expect(await findByText(drawer2Text)).toBeVisible();
  });

  it("navigates out of a screen and closes the drawers cleanly clearing the queue", async () => {
    const { user, elements, helpers, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.inDrawer1NavigateToEmptyButton());
    await helpers.waitForMainScreenDisappear();
    expect(queryByText(drawer1Text)).toBeNull();
    await user.press(elements.navigateBackButton());
    await helpers.expectBackOnMainScreen();
    await helpers.openDrawer1();
  });

  it("opens two drawers, then navigates to another screen that has a drawer opened, then closes it", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.inDrawer1NavigateToScreen1Button());
    await helpers.waitForMainScreenDisappear();
    helpers.expectDrawersClosed(drawer1Text, drawer2Text);
    expect(await findByText(drawerOnScreen1Text)).toBeVisible();
    await user.press(elements.closeButton());
    helpers.expectDrawersClosed(drawerOnScreen1Text, drawer1Text, drawer2Text);
    await user.press(elements.navigateBackButton());
    await helpers.expectBackOnMainScreen();
    await helpers.openDrawer1();
  });

  it("opens two drawers, forces open another one, navigates to other screen", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.inDrawer1Drawer4ForcingButton());
    expect(await findByText(drawer4Text)).toBeVisible();
    helpers.expectDrawersClosed(drawer1Text, drawer2Text);
    await user.press(elements.inDrawer4NavigateToScreen1Button());
    await helpers.waitForMainScreenDisappear();
    expect(await findByText(drawerOnScreen1Text)).toBeVisible();
    await user.press(elements.closeButton());
    helpers.expectDrawersClosed(drawerOnScreen1Text, drawer1Text, drawer2Text, drawer4Text);
    await user.press(elements.navigateBackButton());
    await helpers.expectBackOnMainScreen();
    await helpers.openDrawer1();
  });

  it("opens two drawers, forces open another one, navigates to other screen with a drawer opened", async () => {
    const { user, elements, helpers, findByText, queryByText } = setupTest();

    await helpers.openDrawer1();
    await user.press(elements.inDrawer1Drawer2Button());
    expect(queryByText(drawer2Text)).toBeNull();
    await user.press(elements.inDrawer1Drawer4ForcingButton());
    expect(await findByText(drawer4Text)).toBeVisible();
    helpers.expectDrawersClosed(drawer1Text, drawer2Text);
    await user.press(elements.inDrawer4NavigateToScreen1Button());
    await helpers.waitForMainScreenDisappear();
    expect(await findByText(drawerOnScreen1Text)).toBeVisible();
    helpers.expectDrawersClosed(drawer1Text, drawer2Text, drawer4Text);
    await user.press(elements.closeButton());
    helpers.expectDrawersClosed(drawerOnScreen1Text, drawer1Text, drawer2Text);
    await user.press(elements.navigateBackButton());
    await helpers.expectBackOnMainScreen();
    await helpers.openDrawer1();
  });
});
