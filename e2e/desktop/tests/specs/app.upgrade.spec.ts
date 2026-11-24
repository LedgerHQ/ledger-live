import { test } from "tests/fixtures/appUpgrade";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { buildTags } from "tests/utils/tagsUtils";
import { hasNightlyBuilds } from "tests/utils/nightlyBuildUtils";

// Two cold starts and a device account scan, on top of the default per-test budget.
const UPGRADE_TEST_TIMEOUT_MS = 600_000;

const currency = Currency.ETH;
const accountName = `${currency.name} 1`;
const counterValue = { search: "euro", label: "Euro - EUR", ticker: "EUR", symbol: "€" };
// The app starts with a dark system theme, so Light only shows if the setting survived.
const theme = { label: "Light", value: "light" } as const;

test.describe("App upgrade", () => {
  test.skip(!hasNightlyBuilds(), "Nightlies are only published for Linux and macOS");
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: currency.speculosApp,
  });

  test(
    // A literal title lets a filtered CI run size itself to one shard.
    "[ETH] - Upgrade from the previous nightly - account, counter value and theme kept",
    {
      tag: buildTags({ currencyId: currency.id, extraTags: ["@upgrade"] }),
      annotation: { type: "TMS", description: "B2CQA-2082" },
    },
    async ({ appUpgrade, userdataFile }) => {
      test.setTimeout(UPGRADE_TEST_TIMEOUT_MS);

      const previousApp = await appUpgrade.launchPreviousVersion();
      await previousApp.portfolio.expectPortfolioEmptyState();
      await previousApp.portfolio.clickAddAccountButton();
      await previousApp.modularDialog.validateItems();
      await previousApp.modularDialog.selectAssetByTicker(currency);
      await previousApp.modularDialog.selectNetwork(currency);
      await previousApp.scanAccountsDrawer.selectFirstAccount();
      await previousApp.scanAccountsDrawer.clickCloseButton();
      await previousApp.portfolio.expectAccountsPersistedInAppJson(userdataFile, 1);

      await previousApp.mainNavigation.openSettings();
      await previousApp.settings.changeCounterValue(counterValue.search);
      await previousApp.settings.expectCounterValue(counterValue.label);
      await previousApp.settings.changeTheme(theme.label);
      await previousApp.settings.expectThemeSelected(theme.label);
      await previousApp.settings.expectSettingsPersistedInAppJson(userdataFile, {
        counterValue: counterValue.ticker,
        theme: theme.value,
      });

      const app = await appUpgrade.upgradeToNewVersion();
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.expectCryptoAccountRowVisible(accountName);
      await app.accounts.expectAccountsCount(1);
      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.expectTotalBalanceCounterValue(counterValue.symbol);

      await app.mainNavigation.openSettings();
      await app.settings.expectCounterValue(counterValue.label);
      await app.settings.expectThemeSelected(theme.label);
      await app.settings.expectAppColorScheme(theme.value);
    },
  );
});
