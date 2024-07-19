import test from "../../fixtures/common";
import { specs } from "../../utils/speculos";
import { Currency } from "../../enum/Currency";
import { addTmsLink } from "tests/fixtures/common";

const currencies: Currency[] = [
  Currency.BTC,
  Currency.ETH,
  Currency.ETC,
  Currency.XRP,
  Currency.DOT,
  Currency.TRX,
  Currency.ADA,
  Currency.XLM,
  Currency.BCH,
  Currency.ALGO,
  Currency.ATOM,
  Currency.XTZ,
];

for (const [i, currency] of currencies.entries()) {
  test.describe("Add Accounts", () => {
    test.use({
      userdata: "skip-onboarding",
      testName: `addAccount_${currency.uiName}`,
      speculosCurrency: specs[currency.deviceLabel.replace(/ /g, "_")],
      speculosOffset: i,
    });
    let firstAccountName = "NO ACCOUNT NAME YET";

    test(`[${currency.uiName}] Add account`, async ({ app }) => {
      addTmsLink(["B2CQA-101", "B2CQA-102", "B2CQA-314", "B2CQA-330", "B2CQA-929"]);

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
      await app.account.expectAddressIndex(0);
      await app.account.expectShowMoreButton();
    });
  });
}
