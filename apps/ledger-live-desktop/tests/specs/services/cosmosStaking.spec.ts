import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { PortfolioPage } from "tests/models/PortfolioPage";
import { DiscoverPage } from "tests/models/DiscoverPage";
import { MarketPage } from "tests/models/MarketPage";
import { Layout } from "tests/models/Layout";
import { MarketCoinPage } from "tests/models/MarketCoinPage";
import { AssetPage } from "tests/models/AssetPage";
import { AccountsPage } from "tests/models/AccountsPage";
import { AccountPage } from "tests/models/AccountPage";

test.use({
  userdata: "cosmosOsmosisStakingAccounts",
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
        solana: {
          redelegate: true,
          delegegate: true,
        },
        eth: {
          kiln: true,
          lido: true,
        },
      },
    },
  },
  env: { DEV_TOOLS: true },
});

process.env.PWDEBUG = "1";

test("Cosmos staking flows via portfolio, asset page and market page", async ({ page }) => {
  const portfolioPage = new PortfolioPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const liveApp = new DiscoverPage(page);
  const assetPage = new AssetPage(page);
  const accountsPage = new AccountsPage(page);
  const accountPage = new AccountPage(page);
  const layout = new Layout(page);
  const marketPage = new MarketPage(page);
  const marketCoinPage = new MarketCoinPage(page);

  await test.step(
    "access stake cosmos from portfolio page with an account that isn't staking",
    async () => {
      await portfolioPage.startStakeFlow();
      await drawer.waitForDrawerToBeVisible();
      await drawer.selectCurrency("cosmos");
      await drawer.selectAccount("cosmos", 0);
      await expect.soft(modal.container).toHaveScreenshot("earn-modal-staking-cosmos-account.png");
      await modal.continue();
      await expect
        .soft(modal.container)
        .toHaveScreenshot("modal-staking-cosmos-account.png");
      await modal.close();
      await expect
      .soft(page)
      .toHaveScreenshot("non-cosmos-account-page.png");
      await accountPage.clickBannerCTA();
      await expect
        .soft(modal.container)
        .toHaveScreenshot("modal-staking-cosmos-account-2.png");
      await modal.close();
    },
  );

  // await test.step(
  //   "access stake cosmos from portfolio page with an account with worse provider than ledger",
  //   async () => {
  //     await layout.goToPortfolio();
  //     await portfolioPage.startStakeFlow();
  //     await drawer.waitForDrawerToBeVisible();
  //     await drawer.selectCurrency("cosmos");
  //     await drawer.selectAccount("cosmos", 1);
  //     await expect
  //       .soft(modal.container)
  //       .toHaveScreenshot("modal-staking-cosmos-account-3.png");
  //     await modal.close();
  //     await expect
  //     .soft(page)
  //     .toHaveScreenshot("worst-provider-cosmos-account-page.png");
  //     await accountPage.clickBannerCTA();
  //     await page.pause();
  //     await expect
  //       .soft(modal.container)
  //       .toHaveScreenshot("modal-staking-cosmos-account-4.png");
  //     await modal.close();
  //   },
  // );
});
