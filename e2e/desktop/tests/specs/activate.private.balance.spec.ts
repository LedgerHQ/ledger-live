import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import {
  zcashPrivateBalanceTestUse,
  zcashPrivateBalanceTestOptions,
  openZcashAccountUnderTest,
} from "tests/utils/zcashPrivateBalanceUtils";

const accounts = [
  { account: Account.ZEC_1, xrayTicket: "B2CQA-4300", birthdayHeight: "2026-08-01" },
];

for (const account of accounts) {
  test.describe("Activate private balance", () => {
    test.use(zcashPrivateBalanceTestUse(account.account));

    test(
      `[${account.account.currency.testLabel}] - Activate private balance`,
      zcashPrivateBalanceTestOptions(account.account, account.xrayTicket),
      async ({ app }) => {
        await openZcashAccountUnderTest(app, account.account);
        await app.account.clickShowBalance();
        await app.privateBalance.expectModalVisibility();
        await app.privateBalance.editBirthdayHeight(account.birthdayHeight);
        await app.privateBalance.clickContinue();
        await app.privateBalance.clickContinue();
        await app.speculos.exportUfvk(account.account);
        await app.privateBalance.confirmUfvkExportedFromDevice();
        await app.privateBalance.close();

        // TODO: extend to shielded-address receive coverage once the device-reconnect
        // stall on reopening the Receive modal right after this one is fixed.
      },
    );
  });
}
