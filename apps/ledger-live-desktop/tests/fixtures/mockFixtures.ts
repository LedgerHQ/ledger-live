import { Page } from "@playwright/test";
import { test as base } from "./common";
import { getStatusMock } from "tests/specs/services/services-api-mocks/getStatus.mock";

type TestFixtures = {
  mockProviderSvgs: Page;
  mockFeesEndpoint: Page;
  mockSwapCancelledEndpoint: Page;
  mockSwapAcceptedEndpoint: Page;
  mockSwapStatusEndpoint: Page;
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
        // Bitcoin bridge expects blockCount 1 (fast), 3 (medium), 6 (slow)
        // Values are in satoshi per 1000 bytes, so we return different values for each preset
        // 4000 = 4 sat/vbyte (fast), 3000 = 3 sat/vbyte (medium), 2000 = 2 sat/vbyte (slow)
        await route.fulfill({
          headers: { teststatus: "mocked" },
          body: JSON.stringify({
            "1": 4000, // fast: 4 sat/vbyte
            "3": 3000, // medium: 3 sat/vbyte
            "6": 2000, // slow: 2 sat/vbyte
            last_updated: Date.now(),
          }),
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
});

export default test;
