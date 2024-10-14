import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Delegate } from "../../models/Delegate";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const accounts = [
  {
    delegate: new Delegate(Account.ATOM_1, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2731, B2CQA-2740",
  },
  {
    delegate: new Delegate(Account.SOL_1, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2730, B2CQA-2742",
  },
  {
    delegate: new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2732, B2CQA-2741",
  },
];

for (const account of accounts) {
  test.describe("Delegate", () => {
    test.use({
      userdata: "speculos-delegate",
      speculosApp: account.delegate.account.currency.speculosApp,
    });

    test(
      `[${account.delegate.account.currency.name}] Delegate`,
      {
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.delegate.account.accountName);

        await app.account.clickBannerCTA();
        await app.delegate.verifyProvider(account.delegate.provider);

        await app.delegate.continueDelegate();
        await app.delegate.fillAmount(account.delegate.amount);
        await app.modal.countinueSendAmount();

        await app.speculos.signDelegationTransaction(account.delegate);
        await app.delegate.clickViewDetailsButton();

        await app.drawer.waitForDrawerToBeVisible();
        await app.delegateDrawer.transactionTypeIsVisible();
        await app.delegateDrawer.providerIsVisible(account.delegate);
        await app.delegateDrawer.amountValueIsVisible();
        await app.drawer.close();

        await app.layout.syncAccounts();
        await app.account.clickOnLastOperation();
        await app.delegateDrawer.expectDelegationInfos(account.delegate);
      },
    );
  });
}
