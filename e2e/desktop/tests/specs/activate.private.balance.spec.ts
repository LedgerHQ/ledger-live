import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import { addTmsLink } from "tests/utils/allureUtils";
import { getDescription } from "tests/utils/customJsonReporter";
import { CLI } from "tests/utils/cliUtils";
import { getFamilyByCurrencyId } from "@ledgerhq/live-common/currencies/helpers";

const accounts = [
  { account: Account.ZEC_1, xrayTicket: "B2CQA-4300", birthdayHeight: "2026-01-01" },
];

for (const account of accounts) {
  test.describe("Activate Private Balance", () => {
    test.use({
      userdata: "skip-onboarding",
      speculosApp: account.account.currency.speculosApp,
      cliCommands: [
        (appjsonPath: string) => {
          return CLI.liveData({
            currency: account.account.currency.id,
            index: account.account.index,
            add: true,
            appjson: appjsonPath,
          });
        },
      ],
      featureFlags: {
        zcashShielded: {
          enabled: true,
        },
      },
    });

    const family = getFamilyByCurrencyId(account.account.currency.id);

    test(
      `[${account.account.currency.name}] Activate Private Balance`,
      {
        tag: [
          "@NanoSP",
          "@LNS",
          "@NanoX",
          "@Stax",
          "@Flex",
          "@NanoGen5",
          `@${account.account.currency.id}`,
          ...(family ? [`@family-${family}`] : []),
        ],
        annotation: {
          type: "TMS",
          description: account.xrayTicket,
        },
      },
      async ({ app }) => {
        await addTmsLink(getDescription(test.info().annotations, "TMS").split(", "));
        await app.layout.goToAccounts();
        await app.accounts.navigateToAccountByName(account.account.accountName);
        await app.account.expectAccountVisibility(account.account.accountName);
        await app.account.clickShowBalance();
        await app.privateBalance.expectModalVisibility();
        await app.privateBalance.editBirthdayHeight(account.birthdayHeight);
        await app.privateBalance.clickContinue();
        await app.privateBalance.clickContinue();
        await app.speculos.exportUfvk(account.account);
        await app.privateBalance.confirmUfvkExportedFromDevice();
      },
    );
  });
}
