import test from "../fixtures/common";
import { expect } from "@playwright/test";
import { SwapPage } from "../models/SwapPage";
import { DeviceAction } from "../models/DeviceAction";

// Comment out to disable recorder
// process.env.PWDEBUG = "1";

test.use({ userdata: "1AccountBTC1AccountETH" });

test("Swap", async ({ page }) => {
  const swapPage = new SwapPage(page);
  const deviceAction = new DeviceAction(page);

  let swapId: string;
  let detailsSwapId: string;

  await test.step("Open Swap Page", async () => {
    await swapPage.navigate();
    await swapPage.moveToExchangeButton(); // force the mouse to move to this button so the drawer collapse button disappears
    expect.soft(await page.screenshot()).toHaveScreenshot("open-swap-page.png");
  });

  await test.step("Select Max Spendable", async () => {
    await swapPage.sendMax();
    expect.soft(await page.screenshot()).toHaveScreenshot("max-spendable-swap.png");
  });

  await test.step("Confirm Exchange", async () => {
    await swapPage.confirmExchange();
    expect.soft(await page.screenshot()).toHaveScreenshot("confirm-exchange.png");
  });

  await test.step("Initiate swap with Nano App", async () => {
    await deviceAction.initiateSwap();
    expect.soft(await page.screenshot()).toHaveScreenshot("initiate-swap.png");
  });

  await test.step("Confirm swap with Nano App", async () => {
    await deviceAction.confirmSwap();
    await deviceAction.silentSign();
    const originalSwapId = await swapPage.verifySuccessfulExchange();
    swapId = originalSwapId.replace("#", "");
    expect.soft(await page.screenshot()).toHaveScreenshot("confirm-swap.png");
  });

  await test.step("Verify Swap details are present in the exchange drawer", async () => {
    await swapPage.navigateToExchangeDetails();
    detailsSwapId = await swapPage.verifyExchangeDetails();
    expect(detailsSwapId).toEqual(swapId);
    expect.soft(await page.screenshot()).toHaveScreenshot("verify-swap-details.png");
  });

  await test.step("Verify Swap details are present in the swap history", async () => {
    await swapPage.exitExchangeDrawer();
    await swapPage.verifyHistoricalSwapsHaveLoadedFully();
    expect.soft(await page.screenshot()).toHaveScreenshot("verify-swap-history.png");
  });
});
