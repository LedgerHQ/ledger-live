import { Application } from "../page";
import { Account } from "@ledgerhq/live-common/e2e/enum/Account";

export const initiateSendFlow = async (
  app: Application,
  fromAccount: Account,
  toAccountOrAddress: Account | string,
): Promise<void> => {
  const address = typeof toAccountOrAddress === "string" ? toAccountOrAddress : toAccountOrAddress.address;
  await app.layout.goToAccounts();
  await app.accounts.navigateToAccountByName(fromAccount.accountName);
  await app.account.clickSend();
  await app.send.fillRecipient(address!);
  await app.send.continue();
};

/** For Stellar: fill recipient but do NOT click continue - memo is on the same step */
export const initiateSendFlowToRecipientStep = async (
  app: Application,
  fromAccount: Account,
  toAccountOrAddress: Account | string,
): Promise<void> => {
  const address = typeof toAccountOrAddress === "string" ? toAccountOrAddress : toAccountOrAddress.address;
  await app.layout.goToAccounts();
  await app.accounts.navigateToAccountByName(fromAccount.accountName);
  await app.account.clickSend();
  await app.send.fillRecipient(address!);
  // Wait for loading to finish and memo section to appear (address resolution, React state)
  await app
    .getPage()
    .getByTestId("send-loading-spinner")
    .waitFor({ state: "hidden", timeout: 15000 })
    .catch(() => {});
};
