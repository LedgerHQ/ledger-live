import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { FF_LWD_WALLET_40_Q2 } from "tests/utils/featureFlagUtils";
import { DEVICE_TAGS } from "tests/utils/tagsUtils";

test.describe("Portfolio", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding-with-last-seen-device",
  });

  test(
    "Portfolio zero balance state shows quick actions",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4343",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkNoBalanceTitleVisibility();
      await app.portfolio.expectPortfolioTotalBalanceNotVisible();
      await app.portfolio.expectOneDayPerformanceIndicatorNotVisible();
      await app.portfolio.checkReceiveButtonVisibility();
      await app.portfolio.checkBuyButtonVisibility();
      await app.portfolio.checkSellButtonDisabled();
      await app.portfolio.checkSendButtonDisabled();

      await app.portfolio.expectAddAccountButtonVisible();
      await app.portfolio.clickAddAccountButton();
    },
  );
});

test.describe("Portfolio", () => {
  // With the Asset Section OFF, a single zero-balance account's countervalue is not resolved,
  // so the Wallet 4.0 balance view stays in its loading state and never renders the "$0.00"
  // total nor the performance pill. Every assertion below depends on that resolved balance,
  // so this scenario opts into the Q2 feature-flag set (Asset Section ON).
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountSOL0Balance",
    featureFlags: FF_LWD_WALLET_40_Q2,
  });

  test(
    "Portfolio with a zero-balance account shows balance and analytics",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4350, B2CQA-4340, B2CQA-4342, B2CQA-4345",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkReceiveButtonVisibility();
      await app.portfolio.checkBuyButtonVisibility();
      await app.portfolio.checkSellButtonDisabled();
      await app.portfolio.checkSendButtonDisabled();
      await app.portfolio.expectTotalBalanceToBeZero();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
      await app.portfolio.clickOnPerformancePill();
      await app.analytics.expectAnalyticsScreenToBeVisible();
      await app.analytics.header.clickBack();
      await app.portfolio.expectPortfolioScreenToBeVisible();
    },
  );
});

test.describe("Portfolio", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountBTC1AccountETH",
  });

  test(
    "Portfolio with funds shows balance and quick actions",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4347, B2CQA-4339",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkSellButtonEnabled();
      await app.portfolio.checkSendButtonEnabled();
      await app.portfolio.expectBalanceVisibility();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
    },
  );
});

test.describe("Portfolio", () => {
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "skip-onboarding",
  });

  test(
    "Portfolio without a seen device shows reborn quick actions",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4348",
      },
    },
    async ({ app }) => {
      await app.portfolio.checkNoDeviceTitleVisibility();
      await app.portfolio.checkConnectButtonVisibility();
      await app.portfolio.checkBuyALedgerButtonVisibility();
    },
  );
});

test.describe("Portfolio", () => {
  const currency = Currency.BTC;
  test.use({
    teamOwner: Team.WALLET_XP,
    userdata: "1AccountSOL0Balance",
    speculosApp: currency.speculosApp,
  });

  test(
    "Portfolio adds a funded account and updates balance and quick actions",
    {
      tag: [...DEVICE_TAGS],
      annotation: {
        type: "TMS",
        description: "B2CQA-4351",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

      await app.portfolio.checkReceiveButtonVisibility();
      await app.portfolio.checkBuyButtonVisibility();
      await app.portfolio.checkSellButtonDisabled();
      await app.portfolio.checkSendButtonDisabled();
      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.clickAddAccountButtonFromAccountsPage();

      const selector = await getModularSelector(app, "ASSET");
      if (selector) {
        await selector.validateItems();
        await selector.selectAssetByTicker(currency);
        await selector.selectNetwork(currency);
        await app.scanAccountsDrawer.selectFirstAccount();
        await app.scanAccountsDrawer.clickCloseButton();
      } else {
        await app.addAccount.expectModalVisibility();
        await app.addAccount.selectCurrency(currency);
        await app.addAccount.addAccounts();
        await app.addAccount.done();
      }

      await app.mainNavigation.openTargetFromMainNavigation("home");
      await app.portfolio.checkSellButtonEnabled();
      await app.portfolio.checkSendButtonEnabled();
      await app.portfolio.expectBalanceVisibility();
      await app.portfolio.checkOneDayPerformanceIndicatorVisibility();
    },
  );
});
