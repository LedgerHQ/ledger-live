import { Page } from "@playwright/test";
import { test as base } from "./common";
import { getStatusMock } from "tests/specs/services/services-api-mocks/getStatus.mock";
import { getBitcoinToEthereumRatesMock } from "tests/specs/services/services-api-mocks/getRates.mock";

type TestFixtures = {
  mockProviderSvgs: Page;
  mockFeesEndpoint: Page;
  mockSwapCancelledEndpoint: Page;
  mockSwapAcceptedEndpoint: Page;
  mockSwapStatusEndpoint: Page;
  mockBitcoinToEthereumRates: Page;
  mockSwapDogecoinToEthereumRates: Page;
  mockProvidersCDNData: Page;
};

export const test = base.extend<TestFixtures>({
  mockProviderSvgs: async ({ page }, use) => {
    await page.route("https://cdn.live.ledger.com/icons/providers/boxed/**.svg", async route => {
      console.log("Mocking Provider icons");
      await route.fulfill({
        headers: { teststatus: "mocked" },
        path: "tests/mocks/dummy-provider-icon.svg",
      });
    });

    await use(page);
  },

  mockFeesEndpoint: async ({ page }, use) => {
    await page.route(
      "https://explorers.api.live.ledger.com/blockchain/v4/btc/fees",
      async route => {
        console.log("Mocking Fees endpoint");
        await route.fulfill({
          headers: { teststatus: "mocked" },
          body: JSON.stringify({ "2": 15067, "4": 15067, "6": 15067, last_updated: Date.now() }),
        });
      },
    );

    await use(page);
  },

  // We mock the 'cancelled' swap response because the transaction isn't broadcast when run locally.
  // If 'cancelled' is called then it's a successful test
  mockSwapCancelledEndpoint: async ({ page }, use) => {
    await page.route("https://swap.ledger.com/v5/swap/cancelled", async route => {
      console.log("Mocking swap cancelled HTTP response");
      await route.fulfill({ headers: { teststatus: "mocked" }, body: "" });
    });
    await use(page);
  },

  mockSwapAcceptedEndpoint: async ({ page }, use) => {
    await page.route("https://swap.ledger.com/v5/swap/accepted", async route => {
      console.log("Mocking swap accepted HTTP response");
      await route.fulfill({ headers: { teststatus: "mocked" }, body: "" });
    });
    await use(page);
  },

  mockSwapStatusEndpoint: async ({ page }, use) => {
    await page.route("https://swap.ledger.com/v5/swap/status", async route => {
      console.log("Mocking swap status HTTP response");
      const mockStatusResponse = getStatusMock();
      await route.fulfill({ headers: { teststatus: "mocked" }, body: mockStatusResponse });
    });
    await use(page);
  },

  mockBitcoinToEthereumRates: async ({ page }, use) => {
    await page.route("https://swap.ledger.com/v5/rate**", async route => {
      const mockRatesResponse = getBitcoinToEthereumRatesMock();
      await route.fulfill({ headers: { teststatus: "mocked" }, body: mockRatesResponse });
    });
    await use(page);
  },

  mockSwapDogecoinToEthereumRates: async ({ page }, use) => {
    await page.route("https://swap.ledger.com/v5/currencies/to**", async route => {
      await route.fulfill({
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
    await use(page);
  },

  mockProvidersCDNData: async ({ page }, use) => {
    await page.route("https://cdn.live.ledger.com/swap-providers/data.json", async route => {
      const mockProvidersResponse = getProvidersCDNDataMock();
      await route.fulfill({ headers: { teststatus: "mocked" }, body: mockProvidersResponse });
    });
    await use(page);
  },
});

export default test;
