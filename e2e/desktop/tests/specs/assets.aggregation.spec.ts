import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT } from "tests/utils/featureFlagUtils";

/**
 * Suite: Wallet 4.0 - Asset Aggregation / Asset Market / Asset Detail
 *
 * Requires the Wallet 4.0 `aggregatedAssets` feature flag (off by default in E2E):
 * - Portfolio shows one aggregated row per asset across networks.
 * - Asset rows navigate to the Asset Detail page (/asset/:id).
 * - /market/:id redirects to /asset/:id.
 *
 */

const DEVICE_TAGS = ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"];

test.describe("Wallet 4.0 - Asset Aggregation / Asset Market / Asset Detail", () => {
  test.describe("Scenario 1: Asset aggregation on portfolio", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "portfolioWithManyStablecoins",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Aggregated assets show a single row per asset and list holding addresses per network",
      {
        tag: DEVICE_TAGS,
        annotation: {
          type: "TMS",
          description: "B2CQA-5519, B2CQA-5520",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectSingleAggregatedRow("stablecoins", "USD Coin");

        await app.portfolio.assetsView.clickAggregatedAssetInSection("stablecoins", "USD Coin");
        await expect(app.layout.getPage()).toHaveURL(/\/asset\//);
        await app.assetDetail.expectLoaded();
        await app.assetDetail.expectAddressListVisible();
        expect(await app.assetDetail.countAddressRows()).toBeGreaterThanOrEqual(2);
        await app.assetDetail.expectAddressRowsHaveBalance();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
      },
    );
  });

  test.describe("Scenario 2: Asset market and detail", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Asset detail shows market info, balance, addresses, add-address and transaction history",
      {
        tag: DEVICE_TAGS,
        annotation: {
          type: "TMS",
          description: "B2CQA-5523, B2CQA-5526",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.BTC);
        await expect(app.layout.getPage()).toHaveURL(/\/asset\//);
        await app.assetDetail.expectLoaded();

        await app.assetDetail.expectMarketInfoVisible();

        await app.assetDetail.expectTotalBalanceVisible();
        await app.assetDetail.expectAddressListVisible();
        await app.assetDetail.expectAddAddressVisible();
        await app.assetDetail.expectTransactionsVisible();

        await app.assetDetail.clickFirstTransaction();
        await app.operationDrawer.waitForDrawerToBeVisible();
        await app.operationDrawer.closeDrawer();

        await app.assetDetail.expectPnlCardsVisible();
        await app.assetDetail.openPnlCardDetail();
        await app.assetDetail.closePnlCardDetail();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
      },
    );
  });

  test.describe("Scenario 3: Star assets", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Star an asset from its detail page and filter the market list by starred",
      {
        tag: DEVICE_TAGS,
        annotation: {
          type: "TMS",
          description: "B2CQA-5532, B2CQA-5533",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        const ticker = Currency.BTC.ticker;

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.BTC);
        await app.assetDetail.expectLoaded();
        await app.assetDetail.addToFavorites();
        await app.assetDetail.expectFavorited();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.marketBanner.clickExploreMarketHeader();
        await app.market.validateMarketList();
        await app.market.selectStarredCategory();
        await app.market.expectCoinToBeVisible(ticker);

        await app.market.clickCoinRow(ticker);
        await expect(app.layout.getPage()).toHaveURL(/\/asset\//);
        await app.assetDetail.expectLoaded();
        await app.assetDetail.expectFavorited();

        await app.assetDetail.removeFromFavorites();
        await app.assetDetail.expectNotFavorited();
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.marketBanner.clickExploreMarketHeader();
        await app.market.selectAllCategory();
        await app.market.validateMarketList();
        await app.market.selectStarredCategory();
        await app.market.expectCoinToNotBeVisible(ticker);
      },
    );
  });

  test.describe("Scenario 4: Address detail", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Opening a holding address shows the address detail page",
      {
        tag: DEVICE_TAGS,
        annotation: {
          type: "TMS",
          description: "B2CQA-5535",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.ETH);
        await app.assetDetail.expectLoaded();
        await app.assetDetail.expectAddressListVisible();
        await app.assetDetail.clickFirstAddressRow();
        await expect(app.layout.getPage()).toHaveURL(/\/account\//);

        await app.account.expectAccountHeaderVisible();
        await app.account.expectAccountBalance();
        await app.account.verifyReceiveButtonVisibility();
        await app.account.verifySendButtonVisibility();
        await app.account.expectLastOperationsVisibility();
      },
    );
  });
});
