import { test } from "tests/fixtures/common";
import { Team } from "@ledgerhq/live-e2e-shared/enum/Team";
import { Currency } from "@ledgerhq/live-e2e-shared/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { xrayDataset, xrayKeys } from "@ledgerhq/live-e2e-shared/xray/annotations";
import { getModularSelector } from "tests/utils/modularSelectorUtils";
import { isAssetSectionEnabled } from "tests/utils/featureFlagUtils";
import { buildTags } from "tests/utils/tagsUtils";

// TEST VICTOR -> TO BE REMOVED WITH REAL TICKET
const ADD_ACCOUNT_XRAY_TEST = "B2CQA-6561";

type AddAccountTestCase = {
  readonly currency: Currency;
  readonly portfolioAssetName?: string;
  readonly teamOwner?: Team;
};

const currencies: AddAccountTestCase[] = [
  { currency: Currency.BTC },
  { currency: Currency.ETH },
  { currency: Currency.ETC },
  { currency: Currency.XRP, teamOwner: Team.BST },
  { currency: Currency.DOT, portfolioAssetName: Currency.DOT.name },
  { currency: Currency.TRX },
  { currency: Currency.ADA, teamOwner: Team.BST },
  { currency: Currency.XLM },
  { currency: Currency.BCH },
  { currency: Currency.ALGO, teamOwner: Team.BST },
  { currency: Currency.ATOM },
  { currency: Currency.XTZ, teamOwner: Team.BST },
  { currency: Currency.SOL },
  { currency: Currency.GRAM, teamOwner: Team.BST },
  { currency: Currency.APT, teamOwner: Team.BST },
  { currency: Currency.BASE, portfolioAssetName: Currency.ETH.name },
  { currency: Currency.ZEC, teamOwner: Team.BST },
];

for (const currency of currencies) {
  test.describe("Add account", () => {
    test.use({
      teamOwner: currency.teamOwner ?? Team.COIN_INTEGRATION,
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: currency.currency.speculosApp,
    });

    test(
      `[${currency.currency.testLabel}] - Add account`,
      {
        tag: buildTags({
          currencyId: currency.currency.id,
          extraTags: currency.currency === Currency.ETH ? ["@smoke"] : [],
        }),
        annotation: [
          xrayDataset(ADD_ACCOUNT_XRAY_TEST, {
            Currency: currency.currency.testLabel,
          }),
        ],
      },
      async ({ app, userdataFile }) => {
        await addTmsLink(xrayKeys(test.info().annotations));
        const firstAccountName = `${currency.currency.name} 1`;

        await app.portfolio.waitForPortfolioEmptyState();
        await app.portfolio.clickAddAccountButton();

        const selector = await getModularSelector(app, "ASSET");
        if (selector) {
          await selector.validateItems();
          await selector.selectAssetByTicker(currency.currency);
          await selector.selectNetwork(currency.currency);
          await app.scanAccountsDrawer.selectFirstAccount();
          await app.scanAccountsDrawer.clickCloseButton();
        } else {
          await app.addAccount.expectModalVisibility();
          await app.addAccount.selectCurrency(currency.currency);
          await app.addAccount.addAccounts();
          await app.addAccount.done();
        }

        await app.portfolio.checkOperationHistory();
        await app.portfolio.expectBalanceVisibility();
        if (await isAssetSectionEnabled(app.getPage())) {
          await app.portfolio.assetsView.waitForAssetsToLoad();
          if (currency.portfolioAssetName) {
            await app.portfolio.assetsView.expectSingleAggregatedRow(
              "cryptos",
              currency.portfolioAssetName,
            );
          } else {
            await app.portfolio.assetsView.expectAssetVisibleInSection(
              "cryptos",
              currency.currency,
            );
          }
          await app.portfolio.cryptoAddressesBanner.expectBannerVisible();
          await app.portfolio.cryptoAddressesBanner.expectAddAccountCTANotVisible();
        }
        await app.portfolio.expectAccountsPersistedInAppJson(userdataFile, 1, 5000);

        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(firstAccountName);
        const operationStatus = await app.account.expectFundedAccountDetails(firstAccountName);
        await app.operationDrawer.expectDrawerInfos(firstAccountName, operationStatus);
        await app.operationDrawer.closeDrawer();
        await app.account.expectAddressIndex(0);
        await app.account.expectShowMoreButton();
      },
    );
  });
}

// Aleo is a dataset row like any other coin, but keeps its own describe: the flow adds a
// view-key warning and confirmation, and it needs a feature flag.
test.describe("Add account", () => {
  test.use({
    teamOwner: Team.BST,
    userdata: "skip-onboarding-with-last-seen-device",
    speculosApp: Currency.ALEO.speculosApp,
    featureFlags: {
      // TODO: this can be removed once Aleo is released on production
      currencyAleo: {
        enabled: true,
      },
    },
  });

  test(
    `[${Currency.ALEO.testLabel}] - Add account`,
    {
      tag: buildTags({ currencyId: Currency.ALEO.id, skipLNS: true }),
      annotation: [
        xrayDataset(ADD_ACCOUNT_XRAY_TEST, {
          Currency: Currency.ALEO.testLabel,
        }),
      ],
    },
    async ({ app, userdataFile }) => {
      await addTmsLink(xrayKeys(test.info().annotations));
      const firstAccountName = `${Currency.ALEO.name} 1`;

      await app.portfolio.waitForPortfolioEmptyState();
      await app.portfolio.clickAddAccountButton();

      const selector = await getModularSelector(app, "ASSET");
      if (!selector) {
        throw new Error("Expected modular selector for Aleo add-account flow");
      }

      await selector.validateItems();
      await selector.selectAssetByTicker(Currency.ALEO);
      await selector.selectNetwork(Currency.ALEO);
      await app.scanAccountsDrawer.expectViewKeyWarningVisibility();
      await app.scanAccountsDrawer.clickAllowButton();
      await app.scanAccountsDrawer.selectFirstAccountAndGoToViewKeyConfirmation();
      await app.speculos.shareViewKey();
      await app.scanAccountsDrawer.expectSuccessStepVisibility();
      await app.scanAccountsDrawer.clickCloseButton();

      await app.portfolio.checkOperationHistory();
      await app.portfolio.expectBalanceVisibility();
      await app.portfolio.expectAccountsPersistedInAppJson(userdataFile, 1, 5000);

      await app.mainNavigation.openTargetFromMainNavigation("accounts");
      await app.accounts.navigateToAccountByName(firstAccountName);
      const operationStatus = await app.account.expectFundedAccountDetails(firstAccountName);
      await app.operationDrawer.expectDrawerInfos(firstAccountName, operationStatus);
      await app.operationDrawer.closeDrawer();
      await app.account.expectAddressIndex(0);
      await app.account.expectShowMoreButton();
    },
  );
});
