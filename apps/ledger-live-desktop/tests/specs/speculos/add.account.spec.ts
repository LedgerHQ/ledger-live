import test from "../../fixtures/common";
import { specs } from "../../utils/speculos";
import { Currency } from "../../enum/Currency";
import { Application } from "tests/page";

//TODO: add TONCOIN (TON) when app is available
const currencies: Currency[] = [
  Currency.BTC,
  Currency.ETH,
  Currency.XRP,
  Currency.DOT,
  Currency.TRX,
  Currency.ADA,
  Currency.XLM, //fails due to "Date.parse is not a function" error
  Currency.BCH,
  Currency.ALGO,
  Currency.ATOM,
  Currency.XTZ,
];

for (const [i, currency] of currencies.entries()) {
  test.describe.parallel("Accounts @smoke", () => {
    test.use({
      userdata: "skip-onboarding",
      testName: `addAccount_${currency.uiName}`,
      speculosCurrency: specs[currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });
    let firstAccountName = "NO ACCOUNT NAME YET";

    //@TmsLink("B2CQA-101")
    //@TmsLink("B2CQA-102")
    //@TmsLink("B2CQA-314")
    //@TmsLink("B2CQA-330")
    //@TmsLink("B2CQA-929")

    test(`[${currency.uiName}] Add account`, async ({ page }) => {
      const app = new Application(page);

      await app.portfolio.openAddAccountModal();
      await app.addAccount.expectModalVisiblity();
      await app.addAccount.selectCurrency(currency.uiName);
      firstAccountName = await app.addAccount.getFirstAccountName();

      await app.addAccount.addAccounts();
      await app.addAccount.done();
      await app.layout.expectBalanceVisibility();

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(firstAccountName);
      await app.account.expectAccountVisibility(firstAccountName);
      //Check that balance is not 0 - data-test-id="total-balance"
      //get the balance et checker que ce n'est pas 0
      await app.account.expectLastOperationsVisibility(); //to be not null
    });
  });
}
