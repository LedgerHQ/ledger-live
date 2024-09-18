import { test } from "../../fixtures/common";
import { Currency } from "../../enum/Currency";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const currencies: Currency[] = [
  Currency.BTC,
  Currency.ETH,
  Currency.ETC,
  Currency.XRP,
  //todo: Reactivate after DOT API issue is resolved - TSD-3603
  //Currency.DOT,
  Currency.TRX,
  Currency.ADA,
  Currency.XLM,
  Currency.BCH,
  Currency.ALGO,
  Currency.ATOM,
  Currency.XTZ,
  Currency.SOL,
  Currency.TON,
];

for (const currency of currencies) {
  test.describe("Add Accounts", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: currency.speculosApp,
    });
    let firstAccountName = "NO ACCOUNT NAME YET";

    test(
      `[${currency.name}] Add account`,
      {
        annotation: {
          type: "TMS",
          description: "B2CQA-101, B2CQA-102, B2CQA-314, B2CQA-330, B2CQA-929, B2CQA-786",
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));

        await app.portfolio.openAddAccountModal();
        await app.addAccount.expectModalVisiblity();
        await app.addAccount.selectCurrency(currency);
        firstAccountName = await app.addAccount.getFirstAccountName();

        await app.addAccount.addAccounts();
        await app.addAccount.done();
        // Todo: Remove 'if' when CounterValue is fixed for $TON - LIVE-13685
        if (currency.name !== Currency.TON.name) {
          await app.layout.expectBalanceVisibility();
        }
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(firstAccountName);
        await app.account.expectAccountVisibility(firstAccountName);
        await app.account.expectAccountBalance();
        await app.account.expectLastOperationsVisibility();
        await app.account.expectAddressIndex(0);
        await app.account.expectShowMoreButton();
      },
    );
  });
}
