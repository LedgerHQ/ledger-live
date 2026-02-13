import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { Drawer } from "../../component/drawer.component";
import { SettingsPage } from "../../page/settings.page";
import path from "path";
import { SendModal } from "../../page/modal/send.modal";

test.use({
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    lwdWallet40: {
      enabled: false,
    },
    noah: { enabled: false },
    welcomeScreenVideoCarousel: { enabled: false },
  },
  simulateCamera: path.join(
    __dirname,
    "../../userdata/",
    "qrcode-19qAJ5F2eH7CRPFfj5c94x22zFcXpa8rZ77.y4m",
  ),
});

test("Layout @smoke", async ({ page }) => {
  const layout = new Layout(page);
  const drawer = new Drawer(page);
  const settingsPage = new SettingsPage(page);
  const sendModal = new SendModal(page);

  await test.step("can open send modal and use a qr code from camera", async () => {
    await layout.openSendModalFromSideBar();
    await sendModal.container.waitFor({ state: "visible" });
    const sendButtonLoader = sendModal.container
      .locator("id=send-recipient-continue-button")
      .getByTestId("loading-spinner");
    await sendButtonLoader.waitFor({ state: "detached" });

    await sendModal.selectAccount("Bitcoin 1");
    await sendModal.clickOnCameraButton();

    await expect(sendModal.recipientInput).toHaveValue("19qAJ5F2eH7CRPFfj5c94x22zFcXpa8rZ77");
    await sendModal.closeModal();
  });

  await test.step("go to accounts", async () => {
    await layout.goToAccounts();
    await page.waitForLoadState("networkidle");
    // Wait for accounts list to render (React 19 concurrent rendering may defer the paint)
    await page.getByTestId("accounts-account-row-item").first().waitFor({ state: "visible" });
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
    await layout.goToExperimentalFeatures();
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
    await page.getByTestId("portfolio-container").waitFor({ state: "visible" });
    await layout.toggleDiscreetMode();
    await expect.soft(page).toHaveScreenshot("discreet-mode.png", {
      mask: [page.locator("canvas")],
    });
  });

  await test.step("can collapse the main sidebar", async () => {
    await layout.closeSideBar();
    await expect.soft(page).toHaveScreenshot("collapse-sidebar.png", {
      mask: [page.locator("canvas")],
    });
  });

  await test.step("can display the help modal", async () => {
    await layout.openHelp();
    await expect.soft(drawer.content).toHaveScreenshot("help-drawer.png");
  });
});
