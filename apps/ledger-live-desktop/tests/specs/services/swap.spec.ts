import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SwapPage } from "../../models/SwapPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Layout } from "../../models/Layout";

test.use({ userdata: "1AccountBTC1AccountETH" });

test.fixme("Swap", async ({ page }) => {
  const swapPage = new SwapPage(page);
  const deviceAction = new DeviceAction(page);
  const layout = new Layout(page);

  let swapId: string;
  let detailsSwapId: string;

  await test.step("Open Swap Page", async () => {
    await swapPage.navigate();
    await swapPage.moveToExchangeButton(); // force the mouse to move to this button so the drawer collapse button disappears
    await expect.soft(page).toHaveScreenshot("open-swap-page.png");
  });

  await test.step("Select Max Spendable", async () => {
    await swapPage.sendMax();
    await layout.waitForLoadingSpinner();
    await expect.soft(page).toHaveScreenshot("max-spendable-swap.png");
  });

  await test.step("Confirm Exchange", async () => {
    await swapPage.confirmExchange();
    await deviceAction.initiateSwap();
    await expect.soft(page).toHaveScreenshot("initiate-swap.png", { timeout: 20000 });
  });

  await test.step("Confirm swap with Nano App", async () => {
    await deviceAction.confirmSwap();
    await deviceAction.silentSign();
    const originalSwapId = await swapPage.verifySuccessfulExchange();
    swapId = originalSwapId.replace("#", "");
    await expect.soft(page).toHaveScreenshot("confirmed-swap.png");
  });

  await test.step("Verify Swap details are present in the exchange drawer", async () => {
    await swapPage.navigateToExchangeDetails();
    detailsSwapId = await swapPage.verifyExchangeDetails();
    expect(detailsSwapId).toEqual(swapId);
    await expect.soft(page).toHaveScreenshot("verify-swap-details.png");
  });

  await test.step("Verify Swap details are present in the swap history", async () => {
    await swapPage.exitExchangeDrawer();
    await swapPage.verifyHistoricalSwapsHaveLoadedFully();
    await expect.soft(page).toHaveScreenshot("verify-swap-history.png", { timeout: 20000 });
  });
});
