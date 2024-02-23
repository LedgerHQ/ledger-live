import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Analytics } from "../../models/Analytics";
import { Drawer } from "../../models/Drawer";
import { Modal } from "../../models/Modal";
import { PortfolioPage } from "../../models/PortfolioPage";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import { MarketPage } from "../../models/MarketPage";
import { Layout } from "../../models/Layout";
import { MarketCoinPage } from "../../models/MarketCoinPage";
import { AssetPage } from "../../models/AssetPage";
import { AccountsPage } from "../../models/AccountsPage";
import { AccountPage } from "../../models/AccountPage";

test.use({
  env: {
    SEGMENT_TEST: "true",
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
    ethStakingProviders: {
      enabled: true,
      params: {
        listProvider: [
          {
            id: "kiln_pooling",
            liveAppId: "kiln",
            supportLink: "https://www.kiln.fi",
            icon: "Kiln:provider",
            queryParams: {
              focus: "pooled",
            },
          },
          {
            id: "kiln",
            liveAppId: "kiln",
            supportLink: "https://www.kiln.fi",
            icon: "Kiln:provider",
            queryParams: {
              focus: "dedicated",
            },
          },
        ],
      },
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
  },
});

test("Ethereum staking flows via portfolio, asset page and market page @smoke", async ({
  page,
}) => {
  const portfolioPage = new PortfolioPage(page);
  const drawer = new Drawer(page);
  const modal = new Modal(page);
  const liveAppWebview = new LiveAppWebview(page);
  const assetPage = new AssetPage(page);
  const accountsPage = new AccountsPage(page);
  const accountPage = new AccountPage(page);
  const layout = new Layout(page);
  const marketPage = new MarketPage(page);
  const marketCoinPage = new MarketCoinPage(page);
  const analytics = new Analytics(page);

  await test.step("Entry buttons load with feature flag enabled", async () => {
    await expect.soft(page).toHaveScreenshot("portfolio-entry-buttons.png");
  });

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
    const analyticsPromise = analytics.waitForTracking({
      event: "button_clicked2",
      properties: {
        button: "kiln",
        path: "account/mock:1:ethereum:true_ethereum_1:",
        modal: "stake",
        flow: "stake",
        value: "/platform/kiln",
      },
    });
    await modal.chooseStakeProvider("kiln");
    await analyticsPromise;
    await liveAppWebview.waitForCorrectTextInWebview("Ethereum 2");
    const dappURL = await liveAppWebview.getLiveAppDappURL();
    expect(await liveAppWebview.getLiveAppTitle()).toBe("Kiln");
    expect(dappURL).toContain("?focus=dedicated");
    await expect.soft(page).toHaveScreenshot("stake-provider-dapp-has-opened.png", {
      mask: [page.locator("webview")],
    });
  });

  await test.step("start stake flow via Asset page", async () => {
    await layout.goToPortfolio();
    await portfolioPage.navigateToAsset("ethereum");
    await expect.soft(page).toHaveScreenshot("asset-page-with-stake-available.png");
  });

  await test.step("choose to stake Ethereum", async () => {
    await assetPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await expect.soft(page).toHaveScreenshot("stake-drawer-opened-from-asset-page.png");
    await drawer.close();
  });

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

  await test.step("Market page loads with ETH staking available", async () => {
    await layout.goToMarket();
    await marketPage.waitForLoading();
    await expect.soft(page).toHaveScreenshot("market-loaded-with-eth-stake-button-available.png");
  });

  await test.step("start stake flow via Stake entry button", async () => {
    await marketPage.startStakeFlowByTicker("eth");
    await drawer.waitForDrawerToBeVisible();
    await expect.soft(page).toHaveScreenshot("stake-drawer-opened-from-market-page.png");
    await drawer.close();
  });

  await test.step("Go back to Market page and start stake from ETH coin detail page", async () => {
    await layout.goToMarket();
    await marketPage.waitForLoading();
    await marketPage.openCoinPage("eth");
    await marketCoinPage.startStakeFlow();
    await drawer.waitForDrawerToBeVisible();
    await expect.soft(page).toHaveScreenshot("stake-drawer-opened-from-market-coin-page.png");
    await drawer.selectAccount("Ethereum", 1);
    const analyticsPromise = analytics.waitForTracking({
      event: "button_clicked2",
      properties: {
        button: "kiln_pooling",
        path: "account/mock:1:ethereum:true_ethereum_0:",
        modal: "stake",
        flow: "stake",
        value: "/platform/kiln",
      },
    });
    await modal.chooseStakeProvider("kiln_pooling");
    await analyticsPromise;
    const dappURL = await liveAppWebview.getLiveAppDappURL();
    await liveAppWebview.waitForCorrectTextInWebview("Ethereum 1");
    expect(dappURL).toContain("?focus=pooled");
    await expect(await liveAppWebview.getLiveAppTitle()).toBe("Kiln");
  });
});
