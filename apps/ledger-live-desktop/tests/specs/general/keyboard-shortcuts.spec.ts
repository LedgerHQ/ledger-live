import os from "os";
import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { AddAccountModal } from "../../page/modal/add.account.modal";
import { PortfolioPage } from "../../page/portfolio.page";

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

    const isDevToolsOpened = await page.evaluate(
      () =>
        // https://stackoverflow.com/questions/7798748/find-out-whether-chrome-console-is-open
        window.outerHeight - window.innerHeight > 100 ||
        window.outerWidth - window.innerWidth > 100,
    );

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
    const pageURL = () => page.url().split("/").pop();

    await layout.goToSettings();
    const current = pageURL(); // -> settings

    await page.keyboard.press("Backspace");

    // we expect the URL to be the same
    expect(pageURL()).toBe(current);
  });

  // test right-click on the app doesn't open native browser menu
  await test.step("it doesn't open native browser menu", async () => {
    await layout.drawerPortfolioButton.click({ button: "right" });
    await expect(page).toHaveScreenshot("no-native-menu.png");
  });
});
