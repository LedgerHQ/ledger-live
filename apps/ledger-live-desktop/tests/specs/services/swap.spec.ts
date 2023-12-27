/* eslint-disable @typescript-eslint/no-unused-vars */
import test from "../../fixtures/mockFixtures";
import { expect } from "@playwright/test";
import { SwapPage } from "../../models/SwapPage";
import { DeviceAction } from "../../models/DeviceAction";
import { Drawer } from "../../models/Drawer";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { Layout } from "../../models/Layout";
import { Modal } from "../../models/Modal";
import {
  getBitcoinToDogecoinRatesMock,
  getBitcoinToEthereumRatesMock,
  getEthereumToTetherRatesMock,
} from "./services-api-mocks/getRates.mock";

test.use({
  userdata: "1AccountBTC1AccountETH",
});

// Tests to cover in Playwright test suite
// Enter specific amount
// Coin strategy tests
// Errors:
// ‘Insufficient funds’
// Amount too low for providers ‘Amount must be at least …’
// could add pause to HTTP mock to test 'LOADING' component

test.describe.parallel("Swap", () => {
  test("Add accounts via Swap page @smoke", async ({
    page,
    mockProviderSvgs,
    mockFeesEndpoint,
  }) => {
    const layout = new Layout(page);
    const accountsPage = new AccountsPage(page);
    const accountPage = new AccountPage(page);
    const swapPage = new SwapPage(page);
    const modal = new Modal(page);

    const ethereumAccountName = "Ethereum 2";

    await page.route("https://swap.ledger.com/v5/rate**", async route => {
      const mockRatesResponse = getBitcoinToDogecoinRatesMock();
      route.fulfill({ headers: { teststatus: "mocked" }, body: mockRatesResponse });
    });

    await page.route("https://swap.ledger.com/v5/currencies/to**", async route => {
      route.fulfill({
        headers: { teststatus: "mocked" },
        body: JSON.stringify({
          currencyGroups: [
            {
              network: "dogecoin",
              supportedCurrencies: ["dogecoin"],
            },
            {
              network: "ethereum",
              supportedCurrencies: ["ethereum", "ethereum/erc20/usd_tether__erc20_"],
            },
          ],
        }),
      });
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
      await swapPage.filterDestinationCurrencyDropdown("Dogecoin");
      await swapPage.selectCurrencyFromCurrencyDropdown("Dogecoin");
      await swapPage.sendMax(); // entering amount in textbox doesn't generate a quote in mock/PW
      await layout.waitForLoadingSpinnerToHaveDisappeared();
      await swapPage.waitForProviderRates();
      await expect.soft(page).toHaveScreenshot("add-to-account-button.png");
    });

    await test.step("Add account from missing Destination (To) account", async () => {
      await swapPage.addDestinationAccount();
      await expect.soft(page).toHaveScreenshot("add-missing-destination-account.png");
    });
  });

  test("Filter Rates @smoke", async ({ page, mockProviderSvgs, mockFeesEndpoint }) => {
    const swapPage = new SwapPage(page);
    const layout = new Layout(page);

    await page.route("https://swap.ledger.com/v5/rate**", async route => {
      const mockRatesResponse = getEthereumToTetherRatesMock();
      route.fulfill({ headers: { teststatus: "mocked" }, body: mockRatesResponse });
    });

    await test.step("Generate ETH to USDT quotes", async () => {
      await swapPage.navigate();
      await swapPage.reverseSwapPair();
      await swapPage.filterDestinationCurrencyDropdown("Tether USD");
      await layout.waitForLoadingSpinnerToHaveDisappeared();
      await swapPage.selectCurrencyFromCurrencyDropdown("Tether USD");
      await swapPage.sendMax();
      await layout.waitForLoadingSpinnerToHaveDisappeared();
      await swapPage.waitForProviderRates();
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
      await expect.soft(page).toHaveScreenshot("fixed-centralised-quotes-diplayed.png");
    });
  });

  test("Full Swap with Centralised Exchange @smoke", async ({
    page,
    mockProviderSvgs,
    mockFeesEndpoint,
    mockSwapAcceptedEndpoint,
    mockSwapCancelledEndpoint,
    mockSwapStatusEndpoint,
  }) => {
    const swapPage = new SwapPage(page);
    const deviceAction = new DeviceAction(page);
    const drawer = new Drawer(page);
    const layout = new Layout(page);

    await page.route("https://swap.ledger.com/v5/rate**", async route => {
      const mockRatesResponse = getBitcoinToEthereumRatesMock();
      route.fulfill({ headers: { teststatus: "mocked" }, body: mockRatesResponse });
    });

    await page.route("https://swap.ledger.com/v5/currencies/to**", async route => {
      route.fulfill({
        headers: { teststatus: "mocked" },
        body: JSON.stringify({
          currencyGroups: [
            {
              network: "dogecoin",
              supportedCurrencies: ["dogecoin"],
            },
            {
              network: "ethereum",
              supportedCurrencies: ["ethereum", "ethereum/erc20/usd_tether__erc20_"],
            },
          ],
        }),
      });
    });

    await test.step("Open Swap Page", async () => {
      await swapPage.navigate();
      await swapPage.waitForSwapFormToLoad();
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
      await expect.soft(drawer.content).toHaveScreenshot("initiate-swap.png");
    });

    await test.step("Confirm swap with Nano App", async () => {
      await deviceAction.confirmSwap();
      await deviceAction.silentSign();
      await swapPage.waitForSuccessfulExchange();
      await expect.soft(swapPage.swapId).toHaveText("#12345");
      await expect.soft(drawer.content).toHaveScreenshot("confirmed-swap.png");
    });

    await test.step("Verify Swap details are present in the exchange drawer", async () => {
      await swapPage.navigateToExchangeDetails();
      await swapPage.waitForExchangeDetails();
      await expect.soft(swapPage.detailsSwapId).toHaveText("12345");
      await expect.soft(drawer.swapAmountFrom).toContainText("-1.280"); // regex /-1.280\d+ BTC/ not working with toHaveText() and value can change after the first 3 decimals so this will have to do for now - see LIVE-8642
      await expect.soft(drawer.swapAmountTo).toContainText("+17.898");
      await expect.soft(drawer.swapAccountFrom).toHaveText("Bitcoin 2 (legacy)");
      await expect.soft(drawer.swapAccountTo).toHaveText("Ethereum 2");

      // Flaky due to LIVE-8642 - the formatting is sometimes different values - therefore we are doing the above text checks
      // await expect.soft(drawer.content).toHaveScreenshot("verify-swap-details.png");
    });

    await test.step("Verify Swap details are present in the swap history", async () => {
      await drawer.close();
      await swapPage.verifyHistoricalSwapsHaveLoadedFully();
      await expect.soft(page).toHaveScreenshot("verify-swap-history.png");
    });
  });
});
