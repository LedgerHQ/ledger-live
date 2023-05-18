import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { PortfolioPage } from "../../models/PortfolioPage";
import { DiscoverPage } from "../../models/DiscoverPage";
import { MarketPage } from "../../models/MarketPage";
import { Layout } from "../../models/Layout";
import { MarketCoinPage } from "../../models/MarketCoinPage";
import { AssetPage } from "../../models/AssetPage";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";
import { getProvidersMock } from "./services-api-mocks/getProviders.mock";

test.use({
  env: {
    SEGMENT_TEST: true,
  },
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    stakePrograms: {
      enabled: true,
      params: {
        list: ["ethereum", "solana", "tezos", "polkadot", "tron", "cosmos", "osmo", "celo", "near"],
      },
    },
    portfolioExchangeBanner: {
      enabled: true,
    },
    stakeAccountBanner: {
      enabled: true,
      params: {
        eth: {
          kiln: true,
          lido: false,
        },
      },
    },
    ethStakingProvidersV2: {
      enabled: true,
      params: {
        providers: [
          {
            id: "kilnPooling",
            name: "Kiln",
            liveAppId: "kiln",
            supportLink: "https://www.kiln.fi",
            minAccountBalance: 0,
            icon: "Group",
            queryParams: {
              focus: "pooled",
            },
          },
          {
            id: "kiln",
            name: "Kiln",
            liveAppId: "kiln",
            supportLink: "https://www.kiln.fi",
            minAccountBalance: 0,
            icon: "User",
            queryParams: {
              focus: "dedicated",
            },
          },
        ],
      },
    },
  },
});

test.only("Ethereum staking flows via portfolio, asset page and market page", async ({ page }) => {
  const portfolioPage = new PortfolioPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const liveApp = new DiscoverPage(page);
  const assetPage = new AssetPage(page);
  const accountsPage = new AccountsPage(page);
  const accountPage = new AccountPage(page);
  const layout = new Layout(page);

  await page.route("https://swap.ledger.com/v4/providers**", async route => {
    const mockProvidersResponse = getProvidersMock();
    route.fulfill({ body: mockProvidersResponse });
  });

  await test.step("Entry buttons load with feature flag enabled", async () => {
    await expect.soft(page).toHaveScreenshot("portfolio-entry-buttons.png");
  });

  // Stake entry
  await test.step("start stake flow via Stake entry button", async () => {
    await portfolioPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await expect.soft(page).toHaveScreenshot("stake-drawer-opened-from-portfolio.png");
  });

  await test.step("choose to stake Ethereum", async () => {
    await drawer.selectCurrency("ethereum");
    await expect.soft(page).toHaveScreenshot("choose-account-panel.png");
  });

  await test.step("choose ethereum account", async () => {
    await drawer.selectAccount("Ethereum", 1);
    await expect.soft(page).toHaveScreenshot("choose-stake-provider-modal-from-portfolio-page.png");
  });

  await test.step("choose Kiln", async () => {
    await modal.chooseStakeProvider("Kiln");
    await liveApp.waitForCorrectTextInWebview("Ethereum 2");
    await expect(await liveApp.getLiveAppTitle()).toBe("Kiln");
    await expect.soft(page).toHaveScreenshot("stake-provider-dapp-has-opened.png", {
      mask: [page.locator("webview")],
    });
  });

  // Asset page
  await test.step("start stake flow via Asset page", async () => {
    await layout.goToPortfolio();
    await portfolioPage.navigateToAsset("ethereum");
    await expect.soft(page).toHaveScreenshot("asset-page-with-stake-available.png");
  });

  await test.step("choose to stake Ethereum", async () => {
    await assetPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await expect.soft(page).toHaveScreenshot("stake-drawer-opened-from-asset-page.png");
  });

  await test.step("choose ethereum account", async () => {
    await drawer.selectAccount("Ethereum", 1);
    await expect
      .soft(page)
      .toHaveScreenshot("choose-stake-provider-modal-from-portfolio-page-from-asset-page.png");
    await modal.close();
  });

  // Account page
  await test.step("start stake flow via Account page", async () => {
    await layout.goToAccounts();
    await accountsPage.navigateToAccountByName("Ethereum 2");
    await expect.soft(page).toHaveScreenshot("account-page-with-stake-button-and-banner.png");
  });

  await test.step("choose to stake Ethereum via main stake button", async () => {
    await accountPage.startStakingFlowFromMainStakeButton();
    await modal.waitForModalToAppear();
    await expect.soft(page).toHaveScreenshot("choose-stake-provider-modal-from-account-page.png");
    await modal.close();
  });
});
