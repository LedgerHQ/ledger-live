import { test } from "../fixtures/common";
import { Currency } from "@ledgerhq/live-common/e2e/enum/Currency";
import { addTmsLink } from "../utils/allureUtils";
import { getDescription } from "../utils/customJsonReporter";

const currencies = [
  {
    currency: Currency.BTC,
    xrayTicket: "B2CQA-2499, B2CQA-2644, B2CQA-2672, B2CQA-2073",
  },
];

for (const currency of currencies) {
  test.describe("Add Accounts", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: currency.currency.speculosApp,
    });
    let firstAccountName = "NO ACCOUNT NAME YET";

    test(
      `[${currency.currency.name}] Add account`,
      {
        annotation: {
          type: "TMS",
          description: currency.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));

        await app.portfolio.openAddAccountModal();
        await app.addAccount.expectModalVisiblity();
        await app.addAccount.selectCurrency(currency.currency);
        firstAccountName = await app.addAccount.getFirstAccountName();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        await app.portfolio.expectBalanceVisibility();
        await app.portfolio.checkOperationHistory();
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(firstAccountName);
        await app.account.expectAccountVisibility(firstAccountName);
        await app.account.expectAccountBalance();
        await app.account.expectLastOperationsVisibility();
        await app.account.clickOnLastOperation();
        await app.operationDrawer.expectDrawerInfos(firstAccountName);
        await app.operationDrawer.closeDrawer();
        await app.account.expectAddressIndex(0);
        await app.account.expectShowMoreButton();
      },
    );
  });
}
