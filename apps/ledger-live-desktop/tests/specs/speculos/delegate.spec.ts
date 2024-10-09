import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { Delegate } from "../../models/Delegate";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const e2eDelegationAccounts = [
  {
    delegate: new Delegate(Account.ATOM_1, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2740",
  },
  {
    delegate: new Delegate(Account.SOL_1, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2742",
  },
  {
    delegate: new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2741",
  },
];

const validators = [
  {
    delegate: new Delegate(Account.ATOM_1, "0.001", "Ledger"),
    xrayTicket: "B2CQA-2731, B2CQA-385.1",
  },
  {
    delegate: new Delegate(Account.SOL_1, "0.001", "Ledger by Figment"),
    xrayTicket: "B2CQA-2730, B2CQA-385.2",
  },
  {
    delegate: new Delegate(Account.NEAR_1, "0.01", "ledgerbyfigment.poolv1.near"),
    xrayTicket: "B2CQA-2732, B2CQA-385.3",
  },
  {
    delegate: new Delegate(Account.ADA_1, "0.01", "LBF3 - Ledger by Figment 3"),
    xrayTicket: "B2CQA-385.4",
  },
  {
    delegate: new Delegate(Account.MULTIVERS_X_1, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-385.5",
  },
  {
    delegate: new Delegate(Account.OSMO_1, "1", "Ledger by Figment"),
    xrayTicket: "B2CQA-385.6",
  },
];

for (const account of e2eDelegationAccounts) {
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
        await app.modal.fillAmount(account.delegate.amount);
        await app.modal.countinueSendAmount();

        await app.speculos.signDelegationTransaction(account.delegate);
        await app.delegate.clickViewDetailsButton();

        await app.drawer.waitForDrawerToBeVisible();
        await app.drawer.transactionTypeIsVisible();
        await app.drawer.providerIsVisible(account.delegate);
        await app.drawer.amountValueIsVisible();
        await app.drawer.close();

        await app.layout.syncAccounts();
        await app.account.clickOnLastOperation();
        await app.drawer.expectDelegationInfos(account.delegate);
      },
    );
  });
}

for (const validator of validators) {
  test.describe("Select a validator", () => {
    test.use({
      userdata: "speculos-delegate",
      speculosApp: validator.delegate.account.currency.speculosApp,
    });

    test(
      `[${validator.delegate.account.currency.name}] - Select validator`,
      {
        annotation: {
          type: "TMS",
          description: validator.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(validator.delegate.account.accountName);

        await app.account.startStakingFlowFromMainStakeButton();
        await app.modal.continue();

        await app.delegate.verifyProvider(validator.delegate.provider);
        await app.delegate.openSearchProviderModal();
        await app.delegate.checkValidatorListIsVisible();

        // todo partie qui check si on peut selectionner un autre validator
      },
    );
  });
}
