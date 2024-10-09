import { test } from "../../fixtures/common";
import { Account } from "../../enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";

const accounts = [
  {
    account: Account.ATOM_1,
    xrayTicket: "B2CQA-2731",
    provider: "Ledger",
  },
  {
    account: Account.SOL_1,
    xrayTicket: "B2CQA-2730",
    provider: "Ledger by Figment",
  },
  {
    account: Account.NEAR_1,
    xrayTicket: "B2CQA-2732",
    provider: "ledgerbyfigment.poolv1.near",
  },
];

for (const account of accounts) {
  test.describe("Delegate", () => {
    test.use({
      userdata: "speculos-delegate",
    });

    test(
      `[${account.account.currency.name}] Delegate`,
      {
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations).split(", "));
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.account.accountName);

        await app.account.clickBannerCTA();
        await app.delegate.verifyProvider(account.provider);
      },
    );
  });
}
