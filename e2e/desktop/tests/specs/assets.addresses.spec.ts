import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { FF_LWD_WALLET_40_Q2 } from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import {
  EMPTY_STATE_CRYPTOS,
  EMPTY_STATE_STABLECOINS,
  MAX_ITEM_DISPLAYED,
} from "~/mvvm/features/Assets/constants";

const EXPECTED_CRYPTOS = [Currency.BTC, Currency.ETH];
const EXPECTED_ADDITIONAL_CRYPTOS = [
  Currency.SOL,
  Currency.XTZ,
  Currency.XLM,
  Currency.ALGO,
  Currency.XRP,
];
const EXPECTED_STABLECOINS = [Currency.ETH_USDT, Currency.ETH_USDC];

test.describe("Wallet assets", () => {
  // This suite covers the Wallet 4.0 Assets section UI (cryptos/stablecoins sections and category
  // pages), which only exists with the Asset Section ON, so opt into the Q2 feature-flag set.
  test.use({ teamOwner: Team.WALLET_XP, featureFlags: FF_LWD_WALLET_40_Q2 });

  test.describe("Empty state", () => {
    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: Currency.BTC.speculosApp,
    });

    test(
      `[${Currency.BTC.testLabel}] - Wallet assets empty state shows placeholders and add account CTA`,
      {
        tag: [...DEVICE_TAGS],
        annotation: {
          type: "TMS",
          description: "B2CQA-4839, B2CQA-4840",
        },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectHeaderVisible("cryptos");
        await app.portfolio.assetsView.expectHeaderVisible("stablecoins");
        await app.portfolio.assetsView.expectNumberOfRowsInSection("cryptos", EMPTY_STATE_CRYPTOS);
        await app.portfolio.assetsView.expectNumberOfRowsInSection(
          "stablecoins",
          EMPTY_STATE_STABLECOINS,
        );
        await app.portfolio.cryptoAddressesBanner.expectAddAccountCTAVisible();

        await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.BTC);
        await app.marketCoin.expectMarketCoinPageToBeVisible(Currency.BTC.id);

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.clickAddAccountButton();
        await app.modularDialog.validateItems();
        await app.modularDialog.selectAssetByTicker(Currency.BTC);
        await app.modularDialog.selectNetwork(Currency.BTC);
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickCloseButton();

        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectAssetVisibleInSection("cryptos", Currency.BTC);
        await app.portfolio.cryptoAddressesBanner.expectBannerVisible();
        await app.portfolio.cryptoAddressesBanner.expectAddAccountCTANotVisible();
      },
    );
  });

  test.describe("Fewer than 6 assets", () => {
    test.use({ userdata: "1AccountBTC1AccountETH" });

    test(
      `[${EXPECTED_CRYPTOS.map(c => c.testLabel).join("-")}] - Wallet assets section with fewer than 6 cryptos and stablecoins`,
      {
        tag: [...DEVICE_TAGS],
        annotation: {
          type: "TMS",
          description: "B2CQA-4841",
        },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectHeaderVisible("cryptos");
        await app.portfolio.assetsView.expectHeaderVisible("stablecoins");
        await app.portfolio.assetsView.expectAssetsVisibleInSection("cryptos", EXPECTED_CRYPTOS);
        await app.portfolio.cryptoAddressesBanner.expectBannerVisible();
        await app.portfolio.cryptoAddressesBanner.expectAddAccountCTANotVisible();
      },
    );
  });

  test.describe("Capped display", () => {
    test.use({ userdata: "portfolioWithManyStablecoins" });

    test(
      "Wallet assets section caps cryptos and stablecoins at 6",
      {
        tag: [...DEVICE_TAGS],
        annotation: {
          type: "TMS",
          description: "B2CQA-4834, B2CQA-4837, B2CQA-4838",
        },
      },
      async ({ app }) => {
        await app.mainNavigation.openTargetFromMainNavigation("home");
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectHeaderVisible("cryptos");
        await app.portfolio.assetsView.expectHeaderVisible("stablecoins");
        await app.portfolio.assetsView.expectNumberOfRowsInSection("cryptos", MAX_ITEM_DISPLAYED);
        await app.portfolio.assetsView.expectNumberOfRowsInSection(
          "stablecoins",
          MAX_ITEM_DISPLAYED,
        );

        await app.portfolio.assetsView.expectAssetsVisibleInSection("cryptos", EXPECTED_CRYPTOS);
        await app.portfolio.assetsView.expectAssetsVisibleInSection(
          "stablecoins",
          EXPECTED_STABLECOINS,
        );

        await app.portfolio.assetsView.clickShowMore("cryptos");
        await app.cryptoAssets.expectAssetsPage();
        await app.cryptoAssets.expectAssetsVisible([
          ...EXPECTED_CRYPTOS,
          ...EXPECTED_ADDITIONAL_CRYPTOS,
        ]);

        await app.cryptoAssets.clickBack();
        await app.portfolio.assetsView.waitForAssetsToLoad();

        await app.portfolio.assetsView.clickShowMore("stablecoins");
        await app.stablecoinsAssets.expectAssetsPage();
        await app.stablecoinsAssets.expectAssetsVisible(EXPECTED_STABLECOINS);
      },
    );
  });
});
