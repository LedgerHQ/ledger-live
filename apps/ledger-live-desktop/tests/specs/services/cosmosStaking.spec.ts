import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Drawer } from "../../component/drawer.component";
import { Modal } from "../../component/modal.component";
import { PortfolioPage } from "../../page/portfolio.page";
import { Layout } from "../../component/layout.component";
import { AccountPage } from "../../page/account.page";

test.use({
  userdata: "cosmosStakingAccounts",
  featureFlags: {
    stakePrograms: {
      enabled: true,
      params: {
        list: ["ethereum", "cosmos", "osmo"],
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

test.skip("Cosmos staking flows via portfolio. Check stake flow modals and stake banner", async ({
  page,
}) => {
  const portfolioPage = new PortfolioPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const accountPage = new AccountPage(page);
  const layout = new Layout(page);

  await test.step("access stake cosmos from portfolio page with an account that isn't staking", async () => {
    await portfolioPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await drawer.selectCurrency("cosmos");
    // FIXME: this tests relies on the order of accounts to be "by countervalues" and there is no guarantee of that / it is not the purpose of this test. so it is recommended to use another way to select an account.
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
  });

  await test.step("access stake cosmos from portfolio page with an account with worse provider than ledger", async () => {
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
    await expect(modal.content).toHaveScreenshot("redelegate-cosmos-content.png"); // Network fees are flaky and causing failures. Just verifying the modal content, not the footer
    await modal.close();
  });

  await test.step("access stake cosmos from portfolio page with an account with better provider than ledger and not extra funds", async () => {
    await layout.goToPortfolio();
    await portfolioPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await drawer.selectCurrency("cosmos");
    await drawer.selectAccount("cosmos", 2);
    await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
    await modal.close();
    await expect.soft(accountPage.stakeBanner).toHaveCount(0);
  });

  await test.step("access stake cosmos from portfolio page with an account with everything delegated with ledger provider", async () => {
    await layout.goToPortfolio();
    await portfolioPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await drawer.selectCurrency("cosmos");
    await drawer.selectAccount("cosmos", 3);
    await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
    await modal.close();
    await expect.soft(accountPage.stakeBanner).toHaveCount(0);
  });

  await test.step("access stake cosmos from portfolio page with an account with no funds", async () => {
    await layout.goToPortfolio();
    await portfolioPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await drawer.selectCurrency("cosmos");
    await drawer.selectAccount("cosmos", 4);
    await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
    await modal.close();
    await expect.soft(accountPage.stakeBanner).toHaveCount(0);
  });

  await test.step("access stake cosmos from portfolio page with an account with no funds previosly used to have it", async () => {
    await layout.goToPortfolio();
    await portfolioPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await drawer.selectCurrency("cosmos");
    await drawer.selectAccount("cosmos", 5);
    await expect.soft(modal.container).toHaveScreenshot("non-funds-cosmos-account-modal.png");
    await modal.close();
    await expect.soft(page).toHaveScreenshot("no-funds-cosmos-account-page.png");
  });
});
