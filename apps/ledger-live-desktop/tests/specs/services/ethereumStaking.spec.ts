import test from "../../fixtures/common";
import { expect } from "@playwright/test";
import { Analytics } from "../../models/Analytics";
import { Drawer } from "../../component/drawer.component";
import { Modal } from "../../component/modal.component";
import { PortfolioPage } from "../../page/portfolio.page";
import { LiveAppWebview } from "../../models/LiveAppWebview";
import { MarketPage } from "../../page/market.page";
import { Layout } from "../../component/layout.component";
import { MarketCoinPage } from "../../page/market.coin.page";
import { AssetPage } from "../../page/asset.page";
import { AccountsPage } from "../../page/accounts.page";
import { AccountPage } from "../../page/account.page";
import { delegateModal } from "../../page/modal/delegate.modal";

test.use({
  env: {
    SEGMENT_TEST: "true",
  },
  userdata: "1AccountBTC1AccountETH",
  featureFlags: {
    referralProgramDesktopSidebar: { enabled: false },
    protectServicesDesktop: { enabled: false },
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
  const delegate = new delegateModal(page);

  const maskItemsInMarket = {
    mask: [
      page.getByTestId("market-small-graph"),
      page.getByTestId("market-coin-price"),
      page.getByTestId("market-cap"),
      page.getByTestId("market-price-change"),
      page.getByRole("row").filter({ hasText: new RegExp("^(?!.*(?:Bitcoin|Ethereum)).*$") }),
    ],
  };

  const maskPartOfItemsInMarket = {
    mask: [page.getByRole("row").filter({ hasText: new RegExp("^(?!.*(?:Bitcoin|Ethereum)).*$") })],
  };

  await test.step("Entry buttons load with feature flag enabled", async () => {
    await expect.soft(page).toHaveScreenshot("portfolio-entry-buttons.png", {
      mask: [layout.marketPerformanceWidget],
    });
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
    await delegate.chooseStakeProvider("kiln");
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
    await expect
      .soft(page)
      .toHaveScreenshot("market-loaded-with-eth-stake-button-available.png", maskItemsInMarket);
  });

  await test.step("start stake flow via Stake entry button", async () => {
    await marketPage.startStakeFlowByTicker("eth");
    await drawer.waitForDrawerToBeVisible();
    await expect
      .soft(page)
      .toHaveScreenshot("stake-drawer-opened-from-market-page.png", maskPartOfItemsInMarket);
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
    await delegate.chooseStakeProvider("kiln_pooling");
    await analyticsPromise;
    const dappURL = await liveAppWebview.getLiveAppDappURL();
    await liveAppWebview.waitForCorrectTextInWebview("Ethereum 1");
    expect(dappURL).toContain("?focus=pooled");
    expect(await liveAppWebview.getLiveAppTitle()).toBe("Kiln");
  });
});
