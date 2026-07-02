import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { expect } from "@playwright/test";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { coinDetailUrlPattern } from "tests/utils/urlUtils";

test.describe("Market Banner", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "speculos-tests-app",
  });

  test(
    "Validate Market Banner elements, interactions and navigation",
    {
      tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
      annotation: {
        type: "TMS",
        description: "B2CQA-4302, B2CQA-4318, B2CQA-4320, B2CQA-4321, B2CQA-4324, B2CQA-4325",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.expectMarketBannerToBeVisible();
      await app.marketBanner.expectFearAndGreedCardToBeVisible();
      await app.marketBanner.expectTrendingAssetsListToBeVisible();
      await app.marketBanner.clickFearAndGreedCard();
      await app.fearAndGreedDialog.validateFearAndGreedDialogItems();
      await app.fearAndGreedDialog.validateFearAndGreedDialogContent();
      await app.fearAndGreedDialog.closeFearAndGreedDialogWithCta();

      const assetId = await app.marketBanner.clickFirstAssetTile();

      await expect(app.layout.getPage()).toHaveURL(
        await coinDetailUrlPattern(app.layout.getPage(), assetId),
      );
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.clickExploreMarketHeader();
      await expect(app.layout.getPage()).toHaveURL(/\/market$/);
      await app.market.clickCoinRow("BTC");
      await app.marketCoin.expectMarketCoinPageToBeVisible("bitcoin");
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.marketBanner.scrollToAndClickViewAllTile();
      await expect(app.layout.getPage()).toHaveURL(/\/market$/);
      await app.market.clickCoinRow("BTC");
      await app.marketCoin.expectMarketCoinPageToBeVisible("bitcoin");
    },
  );
});
