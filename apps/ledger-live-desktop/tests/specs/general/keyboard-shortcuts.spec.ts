import os from "os";
import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { AddAccountModal } from "tests/models/AddAccountModal";
import { PortfolioPage } from "tests/models/PortfolioPage";

test.use({ userdata: "skip-onboarding" });

// eslint-disable-next-line jest/expect-expect
test("Keyboard shortcuts", async ({ page }) => {
  const layout = new Layout(page);
  const portfolioPage = new PortfolioPage(page);
  const addAccountModal = new AddAccountModal(page);

  // test that CTRL+SHIFT+I doesn't open devtools
  await test.step("it doesn't open devtools", async () => {
    os.platform() === "darwin"
      ? await page.keyboard.press("Meta+Shift+I")
      : await page.keyboard.press("Control+Shift+I");

    const isDevToolsOpened = await page.evaluate(() => {
      return require("@electron/remote")
        .getCurrentWebContents()
        .isDevToolsOpened();
    });

    expect(isDevToolsOpened).toBe(false);
  });

  // test navigation with keyboard in modal
  await test.step("it navigates in modal with keyboard", async () => {
    await portfolioPage.openAddAccountModal();
    await page.keyboard.press("Shift+Tab"); // -> select close button
    await page.keyboard.press("Tab"); // -> goes back to select account input

    // must focus the input
    await page.keyboard.press("Space");
    await expect(addAccountModal.selectAccountInput).toBeFocused();

    // must close the modal
    await page.keyboard.press("Escape");
  });

  // test that backspace doesn't go back in history
  await test.step("it doesn't go back in history", async () => {
    const pageURL = () =>
      page
        .url()
        .split("/")
        .pop();

    await layout.goToSettings();
    const current = pageURL(); // -> settings

    await page.keyboard.press("Backspace");

    // we expect the URL to be the same
    expect(pageURL()).toBe(current);
  });

  // test right-click on the app doesn't open native browser menu
  await test.step("it doesn't open native browser menu", async () => {
    await layout.drawerPortfolioButton.click({ button: "right" });
    expect(await page.screenshot()).toMatchSnapshot("no-native-menu.png");
  });
});
