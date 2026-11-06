import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("Market", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "speculos-tests-app",
  });

  test(
    `[${Account.BTC_NATIVE_SEGWIT_1.currency.testLabel}-${Account.ETH_1.currency.testLabel}] - Market banner navigation and market filters behavior`,
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description:
          "B2CQA-4302, B2CQA-4318, B2CQA-4320, B2CQA-4321, B2CQA-4324, B2CQA-4325, B2CQA-4315, B2CQA-4316, B2CQA-1879",
      },
    },
    async ({ app }) => {
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.expectMarketBannerToBeVisible();
      await app.marketBanner.expectFearAndGreedCardToBeVisible();
      await app.marketBanner.expectTrendingAssetsListToBeVisible();
      await app.marketBanner.clickFearAndGreedCard();
      await app.fearAndGreedDialog.validateFearAndGreedDialogItems();
      await app.fearAndGreedDialog.validateFearAndGreedDialogContent();
      await app.fearAndGreedDialog.closeFearAndGreedDialogWithCta();

      const assetId = await app.marketBanner.clickFirstAssetTile();
      await app.marketCoin.expectMarketCoinPageToBeVisible(assetId);

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.clickExploreMarketHeader();
      await app.market.expectMarketRoute();
      await app.market.clickCoinRow(Currency.BTC.ticker);
      await app.marketCoin.expectMarketCoinPageToBeVisible(Currency.BTC.id);

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.scrollToAndClickViewAllTile();
      await app.market.expectMarketRoute();
      await app.market.clickCoinRow(Currency.BTC.ticker);
      await app.marketCoin.expectMarketCoinPageToBeVisible(Currency.BTC.id);

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.clickExploreMarketHeader();
      await app.market.validateMarketList();

      await app.market.starCoin(Account.BTC_NATIVE_SEGWIT_1.currency.ticker);
      await app.market.selectStarredCategory();
      await app.market.expectCoinToBeVisible(Account.BTC_NATIVE_SEGWIT_1.currency.ticker);
      await app.market.expectCoinToNotBeVisible(Account.ETH_1.currency.ticker);
    },
  );
});
