import { Account } from "@ledgerhq/live-common/e2e/enum/Account";
import test from "../fixtures/common";
import { expect } from "@playwright/test";
import { Addresses } from "@ledgerhq/live-common/e2e/enum/Addresses";

test.use({
  userdata: "sanctioned-addresses",
});

test("Blacklisted addresses", async ({ app }) => {
  await test.step("Receive assets on a blacklisted address", async () => {
    await app.layout.goToAccounts();
    await app.accounts.navigateToAccountByName(Account.SANCTIONED_ETH.accountName);
    await app.account.clickReceive();

    const errorMessageText = await app.receive.getErrorMessageText();
    expect(errorMessageText?.startsWith("Keeping you safe")).toBe(true);

    const remainingMessage = errorMessageText?.replace("Keeping you safe", "");
    expect(remainingMessage).toEqual(
      `This transaction involves a sanctioned wallet address and cannot be processed.\n-- ${Addresses.SANCTIONED_ETHEREUM} Learn more`,
    );
  });
});
