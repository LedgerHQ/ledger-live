import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { SwapPage } from "../../models/SwapPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Drawer } from "../../models/Drawer";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { Layout } from "../../models/Layout";
import { Modal } from "../../models/Modal";
import { getProvidersMock } from "./services-api-mocks/getProviders.mock";
import {
  getBitcoinToDogecoinRatesMock,
  getBitcoinToEthereumRatesMock,
  getEthereumToTetherRatesMock,
} from "./services-api-mocks/getRates.mock";
import { getStatusMock } from "./services-api-mocks/getStatus.mock";

test.use({
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    swapShowDexQuotes: {
      enabled: true,
    },
  },
});

// Tests to cover in Playwright test suite
// Enter specific amount
// Coin strategy tests
// Errors:
// ‘Insufficient funds’
// Amount too low for providers ‘Amount must be at least …’
// could add pause to HTTP mock to test 'LOADING' component

test.describe.parallel("Swap", () => {
  test("Add accounts via Swap page", async ({ page }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const swapPage = new SwapPage(page);
    const modal = new Modal(page);

    const ethereumAccountName = "Ethereum 2";

    await page.route("https://swap.ledger.com/v4/providers**", async route => {
      const mockProvidersResponse = getProvidersMock();
      route.fulfill({ body: mockProvidersResponse });
    });

    await page.route("https://swap.ledger.com/v4/rate**", async route => {
      const mockRatesResponse = getBitcoinToDogecoinRatesMock();
      route.fulfill({ body: mockRatesResponse });
    });

    await test.step("Navigate to swap via account page", async () => {
      await layout.goToAccounts();
      await accountsPage.navigateToAccountByName(ethereumAccountName);
      await accountPage.navigateToSwap();
      await expect.soft(page).toHaveScreenshot("open-swap-page-with-eth-account-selected.png");
    });

    await test.step("Open source (From) account dropdown", async () => {
      await swapPage.selectCurrencyByName(ethereumAccountName);
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
      await swapPage.openDestinationCurrencyDropdown();
      await swapPage.selectCurrencyByName("Dogecoin");
      await swapPage.sendMax(); // entering amount in textbox doesn't generate a quote in mock/PW
      await layout.waitForLoadingSpinnerToHaveDisappeared();
      await expect.soft(page).toHaveScreenshot("add-to-account-button.png");
    });

    await test.step("Add account from missing Destination (To) account", async () => {
      await swapPage.addDestinationAccount();
      await expect.soft(page).toHaveScreenshot("add-missing-destination-account.png");
    });
  });

  test("Filter Rates", async ({ page }) => {
    const swapPage = new SwapPage(page);
    const layout = new Layout(page);

    await page.route("https://swap.ledger.com/v4/providers**", async route => {
      const mockProvidersResponse = getProvidersMock();
      route.fulfill({ body: mockProvidersResponse });
    });

    await page.route("https://swap.ledger.com/v4/rate**", async route => {
      const mockRatesResponse = getEthereumToTetherRatesMock();
      route.fulfill({ body: mockRatesResponse });
    });

    await test.step("Generate ETH to USDT quotes", async () => {
      await swapPage.navigate();
      await swapPage.reverseSwapPair();
      await swapPage.openDestinationCurrencyDropdown();
      await swapPage.selectCurrencyByName("Tether USD (USDT)");
      await swapPage.sendMax();
      await layout.waitForLoadingSpinnerToHaveDisappeared();
      await expect.soft(page).toHaveScreenshot("eth-to-usdt-quotes-generated.png");
    });

    await test.step("Decentralised Quotes filtered", async () => {
      await swapPage.filterByDecentralisedQuotes();
      await expect.soft(page).toHaveScreenshot("only-decentralised-quotes-displayed.png");
    });

    await test.step("Fixed Decentralised Quotes filtered", async () => {
      await swapPage.filterByFixedRateQuotes();
      await expect.soft(page).toHaveScreenshot("fixed-decentralised-quotes-displayed.png");
    });

    await test.step("Floating Decentralised Quotes filtered", async () => {
      await swapPage.filterByFloatingRateQuotes();
      await expect.soft(page).toHaveScreenshot("floating-decentralised-quotes-displayed.png");
    });

    await test.step("Floating Centralised Quotes filtered", async () => {
      await swapPage.filterByCentralisedQuotes();
      await expect.soft(page).toHaveScreenshot("floating-centralised-quotes-displayed.png");
    });

    await test.step("Fixed Centralised filtered", async () => {
      await swapPage.filterByFixedRateQuotes();
      await expect.soft(page).toHaveScreenshot("fixed-centralised-quotes-displayed.png");
    });
  });

  test("Full Swap with Centralised Exchange", async ({ page }) => {
    const swapPage = new SwapPage(page);
    const deviceAction = new DeviceAction(page);
    const drawer = new Drawer(page);
    const layout = new Layout(page);

    let swapId: string;
    let detailsSwapId: string;

    await page.route("https://swap.ledger.com/v4/providers**", async route => {
      const mockProvidersResponse = getProvidersMock();
      route.fulfill({ body: mockProvidersResponse });
    });

    await page.route("https://swap.ledger.com/v4/rate**", async route => {
      const mockRatesResponse = getBitcoinToEthereumRatesMock();
      route.fulfill({ body: mockRatesResponse });
    });

    // We mock the 'cancelled' swap response because the transaction isn't broadcast when run locally.
    // If 'cancelled' is called then it's a successful test
    await page.route("https://swap.ledger.com/v4/swap/cancelled", async route => {
      console.log("Mocking swap cancelled HTTP response");
      route.fulfill({ body: "" });
    });

    await page.route("https://swap.ledger.com/v4/swap/accepted", async route => {
      console.log("Mocking swap accepted HTTP response");
      route.fulfill({ body: "" });
    });

    await page.route("https://swap.ledger.com/v4/swap/status", async route => {
      console.log("Mocking swap status HTTP response");
      const mockStatusResponse = getStatusMock();
      route.fulfill({ body: mockStatusResponse });
    });

    await test.step("Open Swap Page", async () => {
      await swapPage.navigate();
      await expect.soft(page).toHaveScreenshot("open-swap-page.png");
    });

    await test.step("Select Max Spendable", async () => {
      await swapPage.sendMax();
      await layout.waitForLoadingSpinnerToHaveDisappeared();
      await swapPage.waitForExchangeToBeAvailable();
      await expect.soft(page).toHaveScreenshot("max-spendable-swap.png");
    });

    await test.step("Select Different Target Account", async () => {
      await swapPage.openTargetAccountDrawer();
      await expect.soft(drawer.content).toHaveScreenshot("target-account-drawer.png");
      await swapPage.selectTargetAccount("Ethereum 2");
    });

    await test.step("Open Network Fees Drawer", async () => {
      await swapPage.openNetworkFeesDrawer();
      await expect.soft(page).toHaveScreenshot("network-fees-drawer.png");
    });

    await test.step("Navigate to standard fees", async () => {
      await swapPage.selectStandardFees();
      await expect.soft(page).toHaveScreenshot("standard-network-selected.png");
    });

    // there are no UTXOs in the current test data so can't test the coin strategies
    await test.step("Navigate to set custom fee", async () => {
      await swapPage.selectAdvancedFees();
      await swapPage.enterCustomFee("5");
      await drawer.close();
      await layout.waitForLoadingSpinnerToHaveDisappeared();
      await expect.soft(page).toHaveScreenshot("custom-fee-set-for-swap.png");
    });

    await test.step("Confirm Exchange", async () => {
      await swapPage.selectExchangeQuote("changelly", "float");
      await swapPage.confirmExchange();
      await deviceAction.initiateSwap();
      await expect.soft(drawer.content).toHaveScreenshot("initiate-swap.png", { timeout: 10000 });
    });

    await test.step("Confirm swap with Nano App", async () => {
      await deviceAction.confirmSwap();
      await deviceAction.silentSign();
      const originalSwapId = await swapPage.verifySuccessfulExchange();
      swapId = originalSwapId.replace("#", "");
      await expect.soft(drawer.content).toHaveScreenshot("confirmed-swap.png");
    });

    await test.step("Verify Swap details are present in the exchange drawer", async () => {
      await swapPage.navigateToExchangeDetails();
      detailsSwapId = await swapPage.verifyExchangeDetails();
      await expect(detailsSwapId).toEqual(swapId);
      await expect.soft(drawer.content).toHaveScreenshot("verify-swap-details.png");
    });

    await test.step("Verify Swap details are present in the swap history", async () => {
      await drawer.close();
      await swapPage.verifyHistoricalSwapsHaveLoadedFully();
      await expect.soft(page).toHaveScreenshot("verify-swap-history.png", { timeout: 20000 });
    });
  });
});
