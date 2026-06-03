import { test } from "tests/fixtures/common";
import { expect } from "@playwright/test";
import { Team } from "@ledgerhq/live-common/e2e/enum/Team";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { getModularSelector } from "tests/utils/modularSelectorUtils";

/**
 * Suite: Wallet 4.0 - Portfolio-Asset/Address
 *
 * Tests the Assets section on the portfolio page (Wallet 4.0):
 * - Scenario 1: Onboard without accounts, then add an account
 * - Scenario 2: Open the app with accounts (>6 cryptos & >6 stablecoins)
 */

test.describe("Wallet 4.0 - Portfolio-Asset/Address", () => {
  /**
   * Scenario 1a: Open the app without accounts
   *
   * Step 1: Verify placeholder cryptos/stablecoins and Add account CTA
   * Step 2: Click a placeholder asset → redirected to market page
   * Step 3: Go back to portfolio
   * Step 4: Verify the Add account CTA opens the add account flow
   */
  test.describe("Scenario 1: No accounts - empty state", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: Currency.BTC.speculosApp,
    });

    test(
      "Empty state: verify placeholder assets, market navigation, and Add account CTA",
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
        annotation: {
          type: "TMS",
          description: "LIVE-26275",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        // Step 1: Open the app without accounts — verify placeholder assets and Add account CTA
        await test.step("Verify placeholder cryptos, stablecoins and Add account CTA are displayed", async () => {
          await app.mainNavigation.openTargetFromMainNavigation("home");
          await app.assets.waitForAssetsToLoad();
          await expect(app.assets.cryptosSectionHeader).toBeVisible();
          await expect(app.assets.stablecoinsSectionHeader).toBeVisible();
          await app.assets.expectBannerVisible();
          await app.assets.expectAddAccountCTAVisible();
        });

        // Step 2: Select a placeholder asset — redirects to the asset market page
        await test.step("Click placeholder asset - redirected to market page", async () => {
          await app.assets.clickAssetInCryptosSection("Bitcoin");
          await expect(app.layout.getPage()).toHaveURL(/\/market\/bitcoin/);
        });

        // Step 3: Go back to portfolio
        await test.step("Go back to portfolio", async () => {
          await app.mainNavigation.openTargetFromMainNavigation("home");
          await app.assets.waitForAssetsToLoad();
        });

        // Step 4: Add account CTA opens the add account flow (Modular Dialog)
        await test.step("Click Add account CTA - modular add account dialog opens", async () => {
          await app.assets.clickAddAccountBannerCTA();
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
          await app.assets.waitForAssetsToLoad();
          await app.assets.expectAssetVisibleInCryptosSection("Bitcoin");
          await app.assets.expectBannerVisible();
          await app.assets.expectAddAccountCTANotVisible();
        });
      },
    );
  });

  /**
   * Scenario 1b: Portfolio with one pre-loaded account — assets section still displayed
   *
   * Validates Step 4 outcome: after an account exists, asset sections are visible
   * and the banner no longer shows the Add account button.
   */
  test.describe("Scenario 1b: After adding an account", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "1AccountBTC1AccountETH",
    });

    test(
      "After adding an account, asset sections are still displayed",
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
        annotation: {
          type: "TMS",
          description: "LIVE-26275",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await test.step("Asset sections are still displayed after account is added", async () => {
          await app.mainNavigation.openTargetFromMainNavigation("home");
          await app.assets.waitForAssetsToLoad();
          await expect(app.assets.cryptosSectionHeader).toBeVisible();
          await expect(app.assets.stablecoinsSectionHeader).toBeVisible();
          // Banner still visible but without the Add account button
          await app.assets.expectBannerVisible();
          await app.assets.expectAddAccountCTANotVisible();
        });
      },
    );
  });

  /**
   * Scenario 2: Open the app with accounts (>6 cryptos and >6 stablecoins)
   *
   * Step 1: Only 6 cryptos and 6 stablecoins should be displayed
   * Step 2: Click on cryptos title → only cryptos should be displayed
   * Step 3: Go back
   * Step 4: Click on stablecoins title → only stablecoins should be displayed
   */
  test.describe("Scenario 2: Many accounts - capped display and category pages", () => {
    test.use({
      teamOwner: Team.WALLET_XP,
      userdata: "portfolioWithManyStablecoins",
    });

    test(
      "With >6 cryptos and >6 stablecoins: only 6 shown, headers navigate to category pages",
      {
        tag: ["@NanoSP", "@LNS", "@NanoX", "@Stax", "@Flex", "@NanoGen5"],
        annotation: {
          type: "TMS",
          description: "LIVE-26275",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        // Step 1: Only 6 cryptos and 6 stablecoins should be displayed (section headers are clickable)
        await test.step("Verify only 6 cryptos and 6 stablecoins are displayed", async () => {
          await app.mainNavigation.openTargetFromMainNavigation("home");
          await app.assets.waitForAssetsToLoad();
          await expect(app.assets.cryptosSectionHeader).toBeVisible();
          await expect(app.assets.stablecoinsSectionHeader).toBeVisible();
          expect(await app.assets.countCryptosRows()).toBe(6);
          expect(await app.assets.countStablecoinsRows()).toBe(6);
        });

        // Step 2: Click on cryptos title — only cryptos should be displayed
        await test.step("Click cryptos section header - navigates to cryptos-only page", async () => {
          await app.assets.clickCryptosHeader();
          await expect(app.layout.getPage()).toHaveURL(/\/assets\?category=cryptos/);
          await expect(app.assets.cryptoAssetPageContent).toBeVisible();
        });

        // Step 3: Go back to portfolio
        await test.step("Go back to portfolio", async () => {
          await app.mainNavigation.openTargetFromMainNavigation("home");
          await app.assets.waitForAssetsToLoad();
        });

        // Step 4: Click on stablecoins title — only stablecoins should be displayed
        await test.step("Click stablecoins section header - navigates to stablecoins-only page", async () => {
          await app.assets.clickStablecoinsHeader();
          await expect(app.layout.getPage()).toHaveURL(/\/assets\?category=stablecoins/);
          await expect(app.assets.cryptoAssetPageContent).toBeVisible();
        });
      },
    );
  });
});
