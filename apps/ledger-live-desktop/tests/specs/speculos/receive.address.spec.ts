import { test } from "../../fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "../../utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";

const accounts = [
  { account: Account.BTC_NATIVE_SEGWIT_1, xrayTicket: "B2CQA-2559, B2CQA-2687" },
  { account: Account.ETH_1, xrayTicket: "B2CQA-2561, B2CQA-2688, B2CQA-2697" },
  { account: Account.SOL_1, xrayTicket: "B2CQA-2563, B2CQA-2689" },
  { account: Account.TRX_1, xrayTicket: "B2CQA-2565, B2CQA-2690, B2CQA-2699" },
  { account: Account.DOT_1, xrayTicket: "B2CQA-2562, B2CQA-2691" },
  { account: Account.XRP_1, xrayTicket: "B2CQA-2566, B2CQA-2692" },
  { account: Account.BCH_1, xrayTicket: "B2CQA-2558, B2CQA-2693" },
  { account: Account.ATOM_1, xrayTicket: "B2CQA-2560, B2CQA-2694" },
  { account: Account.XTZ_1, xrayTicket: "B2CQA-2564, B2CQA-2695" },
  { account: Account.BSC_1, xrayTicket: "B2CQA-2686, B2CQA-2696, B2CQA-2698" },
];

//Warning 🚨: Test may fail due to the GetAppAndVersion issue - Jira: LIVE-12581
for (const account of accounts) {
  test.describe("Receive", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.account.currency.speculosApp,
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
    });

    test(
      `[${account.account.currency.name}] Receive`,
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
        await app.account.clickReceive();
        switch (account.account) {
          case Account.TRX_1:
            await app.receive.verifySendCurrencyTokensWarningMessage(
              account.account,
              "TRC10/TRC20",
            );
            break;
          case Account.ETH_1:
            await app.receive.verifySendCurrencyTokensWarningMessage(account.account, "Ethereum");
            break;
          case Account.BSC_1:
            await app.receive.verifySendCurrencyTokensWarningMessage(account.account, "BEP20");
            break;
        }
        await app.modal.continue();
        const displayedAddress = await app.receive.getAddressDisplayed();
        await app.receive.expectValidReceiveAddress(displayedAddress);

        await app.speculos.expectValidAddressDevice(account.account, displayedAddress);
        await app.receive.expectApproveLabel();
      },
    );
  });
}

test.describe("Receive", () => {
  const account = Account.TRX_3;
  test.use({
    userdata: "skip-onboarding",
    speculosApp: account.currency.speculosApp,
    cliCommands: [
      (appjsonPath: string) => {
        return CLI.liveData({
          currency: account.currency.currencyId,
          index: account.index,
          add: true,
          appjson: appjsonPath,
        });
      },
    ],
  });
  test(
    `${account.currency.ticker} empty balance Receive displays address activation warning message`,
    {
      annotation: {
        type: "TMS",
        description: "B2CQA-1551",
      },
    },
    async ({ app }) => {
      await addTmsLink(getDescription(test.info().annotations).split(", "));

      await app.layout.goToAccounts();
      await app.accounts.navigateToAccountByName(account.accountName);
      await app.account.expectAccountVisibility(account.accountName);
      await app.account.clickReceive();
      await app.modal.continue();
      await app.receive.verifyTronAddressActivationWarningMessage();
    },
  );
});
