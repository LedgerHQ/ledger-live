import { Application } from "../page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export const initiateSendFlow = async (
  app: Application,
  fromAccount: Account,
  toAccount: Account,
): Promise<void> => {
  await app.layout.goToAccounts();
  await app.accounts.navigateToAccountByName(fromAccount.accountName);
  await app.account.clickSend();
  await app.send.fillRecipient(toAccount.address);
  await app.send.continue();
};
