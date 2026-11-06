import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
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
  test.use({
    teamOwner: Team.WALLET_XP,
    featureFlags: FF_LWD_WALLET_40_Q2_NO_ANALYTICS_CONSENT,
  });

  test.describe("Portfolio aggregation", () => {
    test.use({ userdata: "portfolioWithManyStablecoins" });

    test(
      `[${Currency.ETH_USDC.testLabel}] - Aggregated assets show one row per asset and list holding addresses`,
      {
        tag: [...DEVICE_TAGS],
        annotation: {
          type: "TMS",
          description: "B2CQA-5519, B2CQA-5520",
        },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectSingleAggregatedRow(
          "stablecoins",
          Currency.ETH_USDC.name,
        );

        await app.portfolio.assetsView.clickAggregatedAssetInSection(
          "stablecoins",
          Currency.ETH_USDC.name,
        );
        const assetDetail = app.assetDetail(Currency.ETH_USDC.id);
        await assetDetail.expectLoaded();
        await assetDetail.expectAddressListVisible();
        await assetDetail.expectAddressRowCountAtLeast(2);
        await assetDetail.expectAddressRowsHaveBalance();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
      },
    );
  });

  test.describe("Asset detail", () => {
    test.use({ userdata: "1AccountBTC1AccountETH" });

    test(
      `[${Currency.ETH.testLabel}-${Currency.BTC.testLabel}] - Asset detail shows holding addresses, market info, history and favorites`,
      {
        tag: [...DEVICE_TAGS],
        annotation: {
          type: "TMS",
          description: "B2CQA-5535, B2CQA-5523, B2CQA-5526, B2CQA-5532, B2CQA-5533",
        },
      },
      async ({ app }) => {
        const ethDetail = app.assetDetail(Currency.ETH.id);
        const btcDetail = app.assetDetail(Currency.BTC.id);
        const ticker = Currency.BTC.ticker;

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.ETH);
        await ethDetail.expectLoaded();
        await ethDetail.expectAddressListVisible();
        await ethDetail.clickFirstAddressRow();
        await app.account.expectAccountHeaderVisible();
        await app.account.expectAccountBalance();
        await app.account.verifyReceiveButtonVisibility();
        await app.account.verifySendButtonVisibility();
        await app.account.expectLastOperationsVisibility();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.BTC);
        await btcDetail.expectLoaded();
        await btcDetail.expectMarketInfoVisible();
        await btcDetail.expectTotalBalanceVisible();
        await btcDetail.expectAddressListVisible();
        await btcDetail.expectAddAddressVisible();
        await btcDetail.expectTransactionsVisible();
        await btcDetail.clickFirstTransaction();
        await app.operationDrawer.waitForDrawerToBeVisible();
        await app.operationDrawer.closeDrawer();
        await btcDetail.expectPnlCardsVisible();
        await btcDetail.openPnlCardDetail();
        await btcDetail.closePnlCardDetail();

        await btcDetail.addToFavorites();
        await btcDetail.expectFavorited();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.marketBanner.clickExploreMarketHeader();
        await app.market.validateMarketList();
        await app.market.selectStarredCategory();
        await app.market.expectCoinToBeVisible(ticker);

        await app.market.clickCoinRow(ticker);
        await btcDetail.expectLoaded();
        await btcDetail.expectFavorited();

        await btcDetail.removeFromFavorites();
        await btcDetail.expectNotFavorited();
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
});
