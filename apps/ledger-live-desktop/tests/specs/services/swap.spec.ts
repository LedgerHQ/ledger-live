import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SwapPage } from "../../models/SwapPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Drawer } from "../../models/Drawer";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { Layout } from "../../models/Layout";
import { Modal } from "../../models/Modal";

test.use({ userdata: "1AccountBTC1AccountETH" });

// Tests to cover in Playwright test suite
// Enter specific amount
// Change network fees
// Filter quotes (centralised, decentralised, etc)
// Correct fiat currency used
// Navigate to
// Errors:
// ‘Insufficient funds’
// Amount too low for providers ‘Amount must be at least …’

test.describe.parallel("Swap", () => {
  test("Add accounts via Swap page", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const swapPage = new SwapPage(page);
    const modal = new Modal(page);

    const ethereumAccountName = "Ethereum 2";

    await test.step("Navigate to swap via account page", async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(ethereumAccountName);
      await accountPage.navigateToSwap();
      await expect.soft(page).toHaveScreenshot("open-swap-page-with-eth-account-selected.png");
    });

    await test.step("Open source (From) account dropdown", async () => {
      await swapPage.openAccountDropdownByAccountName(ethereumAccountName);
      await expect.soft(page).toHaveScreenshot("from-account-dropdown-opened.png");
    });

    await test.step("Add account from source (From) account dropdown", async () => {
      await swapPage.addAccountFromAccountDropdown();
      await expect.soft(page).toHaveScreenshot("add-account-from-dropdown.png");
      await modal.close();
    });

    await test.step("Switch currencies", async () => {
      await swapPage.reverseSwapPair();
      await expect.soft(page).toHaveScreenshot("swap-pair-reversed.png");
    });

    await test.step("Add account button appears for missing Destination (To) account", async () => {
      await swapPage.openAccountDropdownByAccountName("Ethereum");
      await swapPage.selectAccountByName("Dogecoin");
      await swapPage.sendMax(); // entering amount in textbox doesn't generate a quote in mock/PW
      await expect.soft(page).toHaveScreenshot("add-to-account-button.png");
    });

    await test.step("Add account from missing Destination (To) account", async () => {
      await swapPage.addDestinationAccount();
      await expect.soft(page).toHaveScreenshot("add-missing-destination-account.png");
    });
  });

  test("Full Swap with Centralised Exchange", async ({ page }) => {
    const swapPage = new SwapPage(page);
    const deviceAction = new DeviceAction(page);
    const drawer = new Drawer(page);

    let swapId: string;
    let detailsSwapId: string;

    await test.step("Open Swap Page", async () => {
      await swapPage.navigate();
      await expect.soft(page).toHaveScreenshot("open-swap-page.png");
    });

    await test.step("Select Max Spendable", async () => {
      await swapPage.sendMax();
      await swapPage.waitForExchangeToBeAvailable();
      await expect.soft(page).toHaveScreenshot("max-spendable-swap.png");
    });

    await test.step("Select Different Target Account", async () => {
      await swapPage.openTargetAccountDrawer();
      await expect.soft(page).toHaveScreenshot("target-account-drawer.png");
      await swapPage.selectTargetAccount("Ethereum 2");
    });

    await test.step("Confirm Exchange", async () => {
      await swapPage.selectExchangeQuote("changelly", "float");
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
      await expect(detailsSwapId).toEqual(swapId);
      await expect.soft(page).toHaveScreenshot("verify-swap-details.png");
    });

    await test.step("Verify Swap details are present in the swap history", async () => {
      await drawer.close();
      await swapPage.verifyHistoricalSwapsHaveLoadedFully();
      await expect.soft(page).toHaveScreenshot("verify-swap-history.png", { timeout: 20000 });
    });
  });
});
