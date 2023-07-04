import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../models/Layout";
import { Drawer } from "../../models/Drawer";
import { SendModal } from "../../models/SendModal";
import { ReceiveModal } from "../../models/ReceiveModal";
import { PortfolioPage } from "../../models/PortfolioPage";
import { SettingsPage } from "../../models/SettingsPage";

test.use({ userdata: "1AccountBTC1AccountETHStarred" });

test("Layout", async ({ page }) => {
  const layout = new Layout(page);
  const drawer = new Drawer(page);
  const sendModal = new SendModal(page);
  const receiveModal = new ReceiveModal(page);
  const portfolioPage = new PortfolioPage(page);
  const settingsPage = new SettingsPage(page);

  await test.step("can open send modal", async () => {
    await layout.openSendModal();
    await sendModal.container.waitFor({ state: "visible" });
    const sendButtonLoader = sendModal.container
      .locator("id=send-recipient-continue-button")
      .locator("data-test-id=loading-spinner");
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
      mask: [page.locator("data-test-id=live-icon-container")],
    });
  });

  await test.step("go to buy / sell cryto", async () => {
    await layout.goToBuyCrypto();
    await expect.soft(page).toHaveScreenshot("buy-sell.png");
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
    await expect
      .soft(page)
      .toHaveScreenshot("discreet-mode.png", { mask: [page.locator("canvas")] });
  });

  await test.step("can collapse the main sidebar", async () => {
    await layout.drawerCollapseButton.click();
    await expect
      .soft(page)
      .toHaveScreenshot("collapse-sidebar.png", { mask: [page.locator("canvas")] });
  });

  await test.step("shows the carousel and can dismiss it", async () => {
    await layout.goToPortfolio();
    await portfolioPage.carousel.waitFor({ state: "visible" });
    await portfolioPage.carouselCloseButton.click();
    await portfolioPage.carouselConfirmButton.click();
    await expect
      .soft(page)
      .toHaveScreenshot("dismiss-carousel.png", { mask: [page.locator("canvas")] });
  });

  await test.step("can display the help modal", async () => {
    await layout.topbarHelpButton.click();
    await expect.soft(drawer.content).toHaveScreenshot("help-drawer.png");
  });
});
