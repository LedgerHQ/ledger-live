import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Layout } from "../../component/layout.component";
import { AppUpdater } from "../../component/app.updater.component";

test.use({
  userdata: "1AccountBTC1AccountETHwCarousel",
  env: { DEBUG_UPDATE: "true" },
});

test("Updater", async ({ page }) => {
  const layout = new Layout(page);
  const appUpdater = new AppUpdater(page);

  await test.step("[idle] state should not be visible", async () => {
    await expect(layout.appUpdateBanner).toBeHidden();
    await expect.soft(page).toHaveScreenshot("app-updater-idle.png", {
      mask: [page.locator("canvas"), layout.marketPerformanceWidget],
    });
  });

  await test.step("[checking] state should be visible", async () => {
    await appUpdater.setStatus("checking");
    await expect.soft(page).toHaveScreenshot("app-updater-layout.png", {
      mask: [page.locator("canvas"), layout.marketPerformanceWidget],
    });
  });

  await test.step("[check-success] state should be visible", async () => {
    await appUpdater.setStatus("check-success");
    await expect.soft(layout.appUpdateBanner).toHaveScreenshot("app-updater-check-success.png");
  });

  await test.step("[update-available] state should be visible", async () => {
    await appUpdater.setStatus("update-available");
    await expect.soft(layout.appUpdateBanner).toHaveScreenshot("app-updater-update-available.png");
  });

  await test.step("[download-progress] state should be visible", async () => {
    await appUpdater.setStatus("download-progress");
    await expect.soft(layout.appUpdateBanner).toHaveScreenshot("app-updater-download-progress.png");
  });

  await test.step("[error] state should be visible", async () => {
    await appUpdater.setStatus("error");
    await expect.soft(page).toHaveScreenshot("app-updater-error-with-carousel.png", {
      mask: [page.locator("canvas"), layout.marketPerformanceWidget],
    });
  });

  await test.step("[error] state (any) should be visible, without the carousel", async () => {
    await layout.goToPortfolio();
    await layout.appUpdateBanner.isVisible();
    await expect.soft(page).toHaveScreenshot("app-updater-error-without-carousel.png", {
      mask: [page.locator("canvas"), layout.marketPerformanceWidget],
    });
  });
});
