import { test } from "tests/fixtures/common";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import invariant from "invariant";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";
import { getModularSelector } from "tests/utils/modularSelectorUtils";

const currencies = [
  {
    currency: Currency.BTC,
    xrayTicket: "B2CQA-4591",
  },
];

for (const currency of currencies) {
  test.describe("Add Accounts - Wallet 4.0", () => {
    test.use({
      userdata: "skip-onboarding-with-last-seen-device",
      speculosApp: currency.currency.speculosApp,
      featureFlags: {
        lwdWallet40: {
          enabled: true,
          params: {
            marketBanner: true,
            graphRework: true,
            quickActionCtas: true,
            mainNavigation: true,
          },
        },
      },
    });

    const family = getFamilyByCurrencyId(currency.currency.id);

    test(
      `[${currency.currency.name}] Add account`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${currency.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: currency.xrayTicket,
        },
      },
      async ({ app, userdataFile }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        const firstAccountName = `${currency.currency.name} 1`;

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

        await app.portfolio.expectPortfolioScreenToBeVisible();
        await app.portfolio.checkOperationHistory();
        await app.portfolio.expectAccountsPersistedInAppJson(userdataFile, 1, 5000);

        await app.mainNavigation.openTargetFromMainNavigation("accounts");
        await app.accounts.navigateToAccountByName(firstAccountName);
        await app.account.expectAccountVisibility(firstAccountName);
        await app.account.expectAccountBalance();
        await app.account.expectLastOperationsVisibility();
        const operationStatus = await app.account.clickOnLastOperationAndReturnStatus();
        invariant(operationStatus, "Expected operationStatus to be defined");
        await app.operationDrawer.expectDrawerInfos(firstAccountName, operationStatus);
        await app.operationDrawer.closeDrawer();
        await app.account.expectAddressIndex(0);
        await app.account.expectShowMoreButton();
      },
    );
  });
}
