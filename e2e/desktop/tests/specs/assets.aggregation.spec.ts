import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT } from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

/**
 * Suite: Wallet 4.0 - Asset Aggregation / Asset Market / Asset Detail
 *
 * Requires the Wallet 4.0 `aggregatedAssets` feature flag (off by default in E2E):
 * - Portfolio shows one aggregated row per asset across networks.
 * - Asset rows navigate to the Asset Detail page (/asset/:id).
 * - /market/:id redirects to /asset/:id.
 *
 */

test.describe("Asset aggregation", () => {
  test.describe("Portfolio aggregation", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "portfolioWithManyStablecoins",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Aggregated assets show one row per asset and list holding addresses",
      {
        tag: [...DEVICE_TAGS],
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
        const assetDetail = app.assetDetail(Currency.ETH_USDC.id);
        await assetDetail.expectLoaded();
        await assetDetail.expectAddressListVisible();
        expect(await assetDetail.countAddressRows()).toBeGreaterThanOrEqual(2);
        await assetDetail.expectAddressRowsHaveBalance();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
      },
    );
  });

  test.describe("Asset detail", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Asset detail shows market info, balances, addresses and transaction history",
      {
        tag: [...DEVICE_TAGS],
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
        const assetDetail = app.assetDetail(Currency.BTC.id);
        await assetDetail.expectLoaded();

        await assetDetail.expectMarketInfoVisible();

        await assetDetail.expectTotalBalanceVisible();
        await assetDetail.expectAddressListVisible();
        await assetDetail.expectAddAddressVisible();
        await assetDetail.expectTransactionsVisible();

        await assetDetail.clickFirstTransaction();
        await app.operationDrawer.waitForDrawerToBeVisible();
        await app.operationDrawer.closeDrawer();

        await assetDetail.expectPnlCardsVisible();
        await assetDetail.openPnlCardDetail();
        await assetDetail.closePnlCardDetail();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
      },
    );
  });

  test.describe("Star assets", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Star an asset and filter the market list by starred",
      {
        tag: [...DEVICE_TAGS],
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
        const assetDetail = app.assetDetail(Currency.BTC.id);
        await assetDetail.expectLoaded();
        await assetDetail.addToFavorites();
        await assetDetail.expectFavorited();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.marketBanner.clickExploreMarketHeader();
        await app.market.validateMarketList();
        await app.market.selectStarredCategory();
        await app.market.expectCoinToBeVisible(ticker);

        await app.market.clickCoinRow(ticker);
        await expect(app.layout.getPage()).toHaveURL(/\/asset\//);
        await assetDetail.expectLoaded();
        await assetDetail.expectFavorited();

        await assetDetail.removeFromFavorites();
        await assetDetail.expectNotFavorited();
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

  test.describe("Address detail", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
      featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
    });

    test(
      "Opening a holding address shows the address detail page",
      {
        tag: [...DEVICE_TAGS],
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
        const assetDetail = app.assetDetail(Currency.ETH.id);
        await assetDetail.expectLoaded();
        await assetDetail.expectAddressListVisible();
        await assetDetail.clickFirstAddressRow();
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
