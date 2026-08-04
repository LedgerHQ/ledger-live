import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { FF_LWD_WALLET_40_Q2 } from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";
import { coinDetailUrlPattern } from "tests/utils/urlUtils";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
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
  test.use({ featureFlags: FF_LWD_WALLET_40_Q2 });

  test.describe("Empty state", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: Currency.BTC.speculosApp,
      featureFlags: {
        // `aggregatedAssets` redirects the legacy market coin route (`/market/:id`) to the asset detail route
        // TODO: remove the override and update test flow linking to up to date test plan.
        lwdWallet40: {
          enabled: true,
          params: {
            ...FF_LWD_WALLET_40_Q2.lwdWallet40.params,
            aggregatedAssets: false,
          },
        },
      },
    });

    test(
      `[${Currency.BTC.testLabel}] - Wallet assets empty state shows placeholders and add account CTA`,
      {
        tag: [...DEVICE_TAGS],
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
        await app.portfolio.assetsView.expectNumberOfRowsInSection("cryptos", EMPTY_STATE_CRYPTOS);
        await app.portfolio.assetsView.expectNumberOfRowsInSection(
          "stablecoins",
          EMPTY_STATE_STABLECOINS,
        );
        await app.portfolio.cryptoAddressesBanner.expectAddAccountCTAVisible();

        // Step 2: Select a placeholder asset — redirects to the asset market page
        await test.step("Click placeholder asset - redirected to market page", async () => {
          await app.portfolio.assetsView.clickAssetInSection("cryptos", Currency.BTC);
          const page = app.layout.getPage();
          await expect(page).toHaveURL(await coinDetailUrlPattern(page, "bitcoin"));
        });

        // Step 3: Go back to portfolio
        await test.step("Go back to portfolio", async () => {
          await app.mainNavigation.openTargetFromMainNavigation("home");
          await app.portfolio.assetsView.waitForAssetsToLoad();
        });

        // Step 4: Add account CTA opens the add account flow (Modular Dialog)
        await test.step("Click Add account CTA - modular add account dialog opens", async () => {
          await app.portfolio.clickAddAccountButton();
          expect(await app.modularDialog.isVisible()).toBeTruthy();
        });

        // Step 5: Add a Bitcoin account through the modular dialog
        await test.step("Add a Bitcoin account via the modular dialog", async () => {
          const selector = await getModularSelector(app, "ASSET");
          if (selector) {
            await selector.selectAssetByTicker(Currency.BTC);
            await selector.selectNetwork(Currency.BTC);
            await app.scanAccountsDrawer.selectFirstAccount();
            await app.scanAccountsDrawer.clickCloseButton();
          }
        });

        // Step 6: Verify the added account is reflected in the assets section
        await test.step("After adding account, Bitcoin is visible in cryptos section and Add account CTA is gone", async () => {
          await app.mainNavigation.openTargetFromMainNavigation("home");
          await app.portfolio.assetsView.waitForAssetsToLoad();
          await app.portfolio.assetsView.expectAssetVisibleInSection("cryptos", Currency.BTC);
          await app.portfolio.cryptoAddressesBanner.expectBannerVisible();
          await app.portfolio.cryptoAddressesBanner.expectAddAccountCTANotVisible();
        });
      },
    );
  });

  test.describe("Fewer than 6 assets", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
    });

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

  test.describe("Capped display", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "portfolioWithManyStablecoins",
    });

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
