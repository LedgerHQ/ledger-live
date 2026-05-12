import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { LWD_WALLET_40_FF_ENABLED } from "tests/utils/featureFlagUtils";
import { MAX_ITEM_DISPLAYED } from "~/mvvm/features/Assets/constants";

const EXPECTED_CRYPTOS = [Currency.BTC, Currency.ETH];
const EXPECTED_ADDITIONAL_CRYPTOS = [
  Currency.SOL,
  Currency.XTZ,
  Currency.XLM,
  Currency.ALGO,
  Currency.XRP,
];
const EXPECTED_STABLECOINS = [Currency.ETH_USDT, Currency.ETH_USDC];

test.describe("Wallet 4.0 - Portfolio-Asset/Address", () => {
  test.describe("No accounts - empty state", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: Currency.BTC.speculosApp,
      featureFlags: LWD_WALLET_40_FF_ENABLED,
    });

    const EMPTY_CRYPTOS_PLACEHOLDER_COUNT = 4;
    const EMPTY_STABLECOINS_PLACEHOLDER_COUNT = 2;

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
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectHeaderVisible("cryptos");
        await app.portfolio.assetsView.expectHeaderVisible("stablecoins");
        await app.portfolio.assetsView.expectNumberOfRowsInSection(
          "cryptos",
          EMPTY_CRYPTOS_PLACEHOLDER_COUNT,
        );
        await app.portfolio.assetsView.expectNumberOfRowsInSection(
          "stablecoins",
          EMPTY_STABLECOINS_PLACEHOLDER_COUNT,
        );
        await app.portfolio.cryptoAddressesBanner.expectAddAccountCTAVisible();

        await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.BTC);
        await app.marketCoin.expectMarketCoinPageToBeVisible(Currency.BTC.name.toLowerCase());
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
        await app.portfolio.assetsView.waitForAssetsToLoad();
        await app.portfolio.assetsView.expectHeaderVisible("cryptos");
        await app.portfolio.assetsView.expectHeaderVisible("stablecoins");
        await app.portfolio.assetsView.expectAssetsVisibleInSection("cryptos", EXPECTED_CRYPTOS);
        await app.portfolio.cryptoAddressesBanner.expectBannerVisible();
        await app.portfolio.cryptoAddressesBanner.expectAddAccountCTANotVisible();
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
        await app.cryptoAssetsPage.expectAssetsPage();
        await app.cryptoAssetsPage.expectAssetsVisible([
          ...EXPECTED_CRYPTOS,
          ...EXPECTED_ADDITIONAL_CRYPTOS,
        ]);

        await app.cryptoAssetsPage.clickBack();
        await app.portfolio.assetsView.waitForAssetsToLoad();

        await app.portfolio.assetsView.clickShowMore("stablecoins");
        await app.stablecoinsAssetsPage.expectAssetsPage();
        await app.stablecoinsAssetsPage.expectAssetsVisible(EXPECTED_STABLECOINS);
      },
    );
  });
});
