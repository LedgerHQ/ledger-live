import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { LWD_WALLET_40_FF_ENABLED } from "tests/utils/featureFlagUtils";
import { expect } from "@playwright/test";

test.describe("Wallet 4.0 - Portfolio-Asset/Address", () => {
  test.describe("No accounts - empty state", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: Currency.BTC.speculosApp,
      featureFlags: LWD_WALLET_40_FF_ENABLED,
    });

    test(
      "Empty state: verify placeholder assets, market navigation, and Add account CTA",
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
        annotation: {
          type: "TMS",
          description: "B2CQA-4839, B2CQA-4840, B2CQA-4841",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.assets.waitForAssetsToLoad();
        await app.assets.cryptosSection.expectHeaderVisible();
        await app.assets.stablecoinsSection.expectHeaderVisible();
        await app.assets.cryptosSection.expectNumberOfRows(4);
        await app.assets.stablecoinsSection.expectNumberOfRows(2);
        await app.assets.expectAddAccountCTAVisible();

        await app.assets.cryptosSection.clickAssetInSection(Currency.BTC.name);
        await app.marketCoin.expectMarketCoinPageToBeVisible(Currency.BTC.name.toLowerCase());

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.assets.waitForAssetsToLoad();

        await app.assets.clickAddAccountBannerCTA();
        await app.modularDialog.waitForDialogToBeVisible();

        const selector = await getModularSelector(app, "ASSET");
        expect(selector).toBeTruthy();
        if (selector) {
          await selector.selectAssetByTicker(Currency.BTC);
          await selector.selectNetwork(Currency.BTC);
          await app.scanAccountsDrawer.selectFirstAccount();
          await app.scanAccountsDrawer.clickCloseButton();
        }

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.assets.waitForAssetsToLoad();
        await app.assets.cryptosSection.expectAssetVisibleInSection(Currency.BTC.name);
        await app.assets.cryptosSection.expectNumberOfRows(4);
        await app.assets.expectBannerVisible();
        await app.assets.expectAddAccountCTANotVisible();
      },
    );
  });

  test.describe("Existing BTC and ETH accounts", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
      featureFlags: LWD_WALLET_40_FF_ENABLED,
    });

    test(
      "Validate assets section with less than 6 cryptos/stablecoins added",
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
        annotation: {
          type: "TMS",
          description: "B2CQA-4841",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.assets.waitForAssetsToLoad();
        await app.assets.cryptosSection.expectHeaderVisible();
        await app.assets.stablecoinsSection.expectHeaderVisible();
        await app.assets.expectBannerVisible();
        await app.assets.expectAddAccountCTANotVisible();
      },
    );
  });

  test.describe("Multiple accounts - capped display and category pages", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "portfolioWithManyStablecoins",
      featureFlags: LWD_WALLET_40_FF_ENABLED,
    });

    test(
      "validate assets section with more than 6 cryptos/stablecoins",
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
        annotation: {
          type: "TMS",
          description: "B2CQA-4834, B2CQA-4837, B2CQA-4838",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.assets.waitForAssetsToLoad();
        await app.assets.cryptosSection.expectHeaderVisible();
        await app.assets.stablecoinsSection.expectHeaderVisible();
        await app.assets.cryptosSection.expectNumberOfRows(6);
        await app.assets.stablecoinsSection.expectNumberOfRows(6);

        await app.assets.clickCryptosHeader();
        await app.assets.cryptoAssetsPage.expectAssetsPage();

        await app.assets.cryptoAssetsPage.clickBack();
        await app.assets.waitForAssetsToLoad();

        await app.assets.clickStablecoinsHeader();
        await app.assets.stablecoinsAssetsPage.expectAssetsPage();
      },
    );
  });
});
