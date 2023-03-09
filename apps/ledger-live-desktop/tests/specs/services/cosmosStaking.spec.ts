import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { PortfolioPage } from "tests/models/PortfolioPage";
import { Layout } from "tests/models/Layout";
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
        cosmos: {
          redelegate: true,
          delegate: true,
        },
      },
    },
  },
});

test("Cosmos staking flows via portfolio. Check stake flow modals and stake banner", async ({
  page,
}) => {
  const portfolioPage = new PortfolioPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const accountPage = new AccountPage(page);
  const layout = new Layout(page);

  await test.step(
    "access stake cosmos from portfolio page with an account that isn't staking",
    async () => {
      await portfolioPage.startStakeFlow();
      await drawer.waitForDrawerToBeVisible();
      await drawer.selectCurrency("cosmos");
      await drawer.selectAccount("cosmos", 0);
      await expect
        .soft(modal.container)
        .toHaveScreenshot("earn-delegate-staking-cosmos-account-modal.png");
      await modal.continue();
      await expect.soft(modal.container).toHaveScreenshot("delegate-cosmos-account-modal.png");
      await modal.close();
      await expect.soft(accountPage.stakeBanner).toHaveScreenshot("delegate-cosmos-banner.png");
      await accountPage.clickBannerCTA();
      await expect.soft(modal.container).toHaveScreenshot("delegate-cosmos-account-modal.png");
      await modal.close();
    },
  );

  await test.step(
    "access stake cosmos from portfolio page with an account with worse provider than ledger",
    async () => {
      await layout.goToPortfolio();
      await portfolioPage.startStakeFlow();
      await drawer.waitForDrawerToBeVisible();
      await drawer.selectCurrency("cosmos");
      await drawer.selectAccount("cosmos", 1);
      await expect.soft(modal.container).toHaveScreenshot("delegate-cosmos-account-modal.png");
      await modal.close();
      await expect.soft(accountPage.stakeBanner).toHaveScreenshot("redelegate-cosmos-banner.png");
      await accountPage.clickBannerCTA();
      await expect
        .soft(modal.container)
        .toHaveScreenshot("earn-redelegate-staking-cosmos-account-modal.png");
      await modal.continue();
      await expect.soft(modal.container).toHaveScreenshot("redelegate-cosmos-account-modal.png");
      await modal.close();
    },
  );

  await test.step(
    "access stake cosmos from portfolio page with an account with better provider than ledger and not extra funds",
    async () => {
      await layout.goToPortfolio();
      await portfolioPage.startStakeFlow();
      await drawer.waitForDrawerToBeVisible();
      await drawer.selectCurrency("cosmos");
      await drawer.selectAccount("cosmos", 2);
      await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
      await modal.close();
      await expect.soft(accountPage.stakeBanner).toHaveCount(0);
    },
  );

  await test.step(
    "access stake cosmos from portfolio page with an account with everything delegated with ledger provider",
    async () => {
      await layout.goToPortfolio();
      await portfolioPage.startStakeFlow();
      await drawer.waitForDrawerToBeVisible();
      await drawer.selectCurrency("cosmos");
      await drawer.selectAccount("cosmos", 3);
      await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
      await modal.close();
      await expect.soft(accountPage.stakeBanner).toHaveCount(0);
    },
  );

  await test.step(
    "access stake cosmos from portfolio page with an account with no funds",
    async () => {
      await layout.goToPortfolio();
      await portfolioPage.startStakeFlow();
      await drawer.waitForDrawerToBeVisible();
      await drawer.selectCurrency("cosmos");
      await drawer.selectAccount("cosmos", 4);
      await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
      await modal.close();
      await expect.soft(accountPage.stakeBanner).toHaveCount(0);
    },
  );

  await test.step(
    "access stake cosmos from portfolio page with an account with no funds previosly used to have it",
    async () => {
      await layout.goToPortfolio();
      await portfolioPage.startStakeFlow();
      await drawer.waitForDrawerToBeVisible();
      await drawer.selectCurrency("cosmos");
      await drawer.selectAccount("cosmos", 5);
      await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
      await modal.close();
      await expect.soft(page).toHaveScreenshot("no-funds-cosmos-account-page.png");
    },
  );
});
