import { test } from "../../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";

const accounts = [
  { account: Account.BTC_NATIVE_SEGWIT_1, xrayTicket: "B2CQA-2548" },
  { account: Account.ETH_1, xrayTicket: "B2CQA-2551" },
  { account: Account.SOL_1, xrayTicket: "B2CQA-2553" },
  { account: Account.XRP_1, xrayTicket: "B2CQA-2557" },
  { account: Account.ADA_1, xrayTicket: "B2CQA-2549" },
  { account: Account.DOT_1, xrayTicket: "B2CQA-2552" },
  { account: Account.TRX_1, xrayTicket: "B2CQA-2556" },
  { account: Account.XLM_1, xrayTicket: "B2CQA-2554" },
  { account: Account.BCH_1, xrayTicket: "B2CQA-2547" },
  { account: Account.ALGO_1, xrayTicket: "B2CQA-2546" },
  { account: Account.ATOM_1, xrayTicket: "B2CQA-2550" },
  { account: Account.XTZ_1, xrayTicket: "B2CQA-2555" },
];

for (const account of accounts) {
  test.describe("Delete Accounts", () => {
    test.use({
      userdata: "skip-onboarding",
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: account.account.currency.currencyId,
            index: account.account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
      speculosApp: account.account.currency.speculosApp,
    });

    test(
      `[${account.account.currency.name}] Delete Account`,
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
        await app.account.expectAccountVisibility(account.account.accountName);

        await app.account.deleteAccount();
        await app.accounts.expectAccountAbsence(account.account.accountName);
      },
    );
  });
}
