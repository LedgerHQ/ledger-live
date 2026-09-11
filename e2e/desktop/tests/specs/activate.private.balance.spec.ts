import { test } from "tests/fixtures/common";
import { Account } from "@ledgerhq/live-e2e-shared/enum/Account";
import { settleAfterDeviceStatusScreen } from "tests/utils/deviceStatusScreen";
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

        // The UFVK export ends on the device's status screen, which drops any APDU
        // sent while it is up (LIVE-37178). Settle before driving the device again.
        await settleAfterDeviceStatusScreen();

        // Now that the UFVK is persisted, the Receive step must show the private
        // address block alongside the public one.
        await app.account.clickReceive();
        await app.receive.continue();
        await app.receive.expectPrivateAddressBlockVisible();
      },
    );
  });
}
