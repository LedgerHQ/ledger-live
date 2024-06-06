import test from "../../fixtures/common";
import { specs } from "../../utils/speculos";
import { Currency } from "../../enum/Currency";
import { Application } from "tests/page";
import { allure } from "allure-playwright";

const currencies: Currency[] = [
  Currency.BTC,
  Currency.ETH,
  Currency.XRP,
  Currency.DOT,
  Currency.TRX,
  Currency.ADA,
  //Currency.XLM, //TODO: Reactivate when Date.Parse issue is fixed - desactivate time machine for Speculos tests
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
      await app.account.expectAccountBalance();
      await app.account.expectLastOperationsVisibility();

      await allure.tms("B2CQA-101", "https://ledgerhq.atlassian.net/browse/B2CQA-101");
      await allure.tms("B2CQA-102", "https://ledgerhq.atlassian.net/browse/B2CQA-102");
      await allure.tms("B2CQA-314", "https://ledgerhq.atlassian.net/browse/B2CQA-314");
      await allure.tms("B2CQA-330", "https://ledgerhq.atlassian.net/browse/B2CQA-330");
      await allure.tms("B2CQA-929", "https://ledgerhq.atlassian.net/browse/B2CQA-929");
    });
  });
}
