import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";
import { SendModal } from "../../page/modal/send.modal";
import { ReceiveModal } from "../../page/modal/receive.modal";
import { SettingsPage } from "../../page/settings.page";

test.use({ userdata: "1AccountBTC1AccountETHStarred" });

test("Layout @smoke", async ({ page }) => {
  const layout = new Layout(page);
  const drawer = new Drawer(page);
  const sendModal = new SendModal(page);
  const receiveModal = new ReceiveModal(page);
  const settingsPage = new SettingsPage(page);

  await test.step("can open send modal", async () => {
    await layout.openSendModal();
    await sendModal.container.waitFor({ state: "visible" });
    const sendButtonLoader = sendModal.container
      .locator("id=send-recipient-continue-button")
      .getByTestId("loading-spinner");
    await sendButtonLoader.waitFor({ state: "detached" });
    await expect.soft(sendModal.container).toHaveScreenshot("send-modal.png");
    await sendModal.close();
  });

  await test.step("can open receive modal", async () => {
    await layout.openReceiveModal();
    await receiveModal.container.waitFor({ state: "visible" });
    await expect.soft(sendModal.container).toHaveScreenshot("receive-modal.png");
    await receiveModal.close();
  });

  await test.step("go to accounts", async () => {
    await layout.goToAccounts();
    await expect.soft(page).toHaveScreenshot("accounts.png");
  });

  await test.step("go to discover", async () => {
    await layout.goToDiscover();
    await expect(page).toHaveURL(/.*\/platform.*/);
    await page.waitForLoadState("domcontentloaded");
    await expect.soft(page).toHaveScreenshot("discover.png", {
      mask: [page.getByTestId("live-icon-container")],
    });
  });

  await test.step("go to experimental features", async () => {
    await layout.goToSettings();
    await settingsPage.experimentalTab.click();
    await settingsPage.enableDevMode();
    await layout.goToPortfolio();
    await layout.drawerExperimentalButton.click();
    await expect.soft(page).toHaveScreenshot("experimental-features.png");
  });

  await test.step("shows a starred account, and can access the page", async () => {
    // FIXME: LL-8899
    // expect(await layout.bookmarkedAccounts.count()).toBe(1);
    // await layout.bookmarkedAccounts.first().click();
    // await expect(page).toHaveURL(/.*\/account\/.*/);
  });

  await test.step("can toggle discreet mode", async () => {
    await layout.goToPortfolio(); // FIXME: remove this line when LL-8899 is fixed
    await layout.toggleDiscreetMode();
    await expect.soft(page).toHaveScreenshot("discreet-mode.png", {
      mask: [page.locator("canvas"), layout.marketPerformanceWidget],
    });
  });

  await test.step("can collapse the main sidebar", async () => {
    await layout.drawerCollapseButton.click();
    await expect.soft(page).toHaveScreenshot("collapse-sidebar.png", {
      mask: [page.locator("canvas"), layout.marketPerformanceWidget],
    });
  });

  await test.step("can display the help modal", async () => {
    await layout.topbarHelpButton.click();
    await expect.soft(drawer.content).toHaveScreenshot("help-drawer.png");
  });
});
