import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";

test.describe("Market Banner", () => {
  test.use({
    userdata: "speculos-tests-app",
    featureFlags: {
      lwdWallet40: {
        enabled: true,
        params: {
          marketBanner: true,
          graphRework: true,
          quickActionCtas: true,
        },
      },
    },
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

      await app.layout.goToPortfolio();

      await app.marketBanner.expectMarketBannerToBeVisible();

      await app.marketBanner.expectFearAndGreedCardToBeVisible();

      await app.marketBanner.expectTrendingAssetsListToBeVisible();

      await app.marketBanner.clickFearAndGreedCard();

      await app.fearAndGreedDialog.validateFearAndGreedDialogItems();

      await app.fearAndGreedDialog.validateFearAndGreedDialogContent();

      await app.fearAndGreedDialog.closeFearAndGreedDialogWithCta();

      const assetId = await app.marketBanner.clickFirstAssetTile();

      await expect(app.layout.getPage()).toHaveURL(new RegExp(`/market/${assetId}`));

      await app.layout.goToPortfolio();

      await app.marketBanner.clickExploreMarketHeader();

      await expect(app.layout.getPage()).toHaveURL(/\/market$/);
      await app.market.openCoinPage("BTC");
      await expect(app.layout.getPage()).toHaveURL(new RegExp(`/market/bitcoin`));

      await app.layout.goToPortfolio();

      await app.marketBanner.scrollToAndClickViewAllTile();

      await expect(app.layout.getPage()).toHaveURL(/\/market$/);
      await app.market.openCoinPage("BTC");
      await expect(app.layout.getPage()).toHaveURL(new RegExp(`/market/bitcoin`));
    },
  );
});
