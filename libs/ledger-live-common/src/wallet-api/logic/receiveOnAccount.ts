import { Account, AccountLike } from "@ledgerhq/types-live";
import { accountToWalletAPIAccount, getAccountIdFromWalletAccountId } from "../converters";
import { getMainAccount, getParentAccount, makeEmptyTokenAccount } from "../../account/index";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { WalletState } from "@ledgerhq/live-wallet/store";
import { WalletAPIContext } from "./context";

export async function receiveOnAccountLogic(
  walletState: WalletState,
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    accountAddress: string,
  ) => Promise<string>,
  tokenCurrency?: string,
): Promise<string> {
  tracking.receiveRequested(manifest);

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.receiveFail(manifest);
    throw new Error(`accountId ${walletAccountId} unknown`);
  }

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.receiveFail(manifest);
    throw new Error("Account required");
  }

  const parentAccount = getParentAccount(account, accounts);
  const mainAccount = getMainAccount(account, parentAccount);
  const currency = tokenCurrency ? await getCryptoAssetsStore().findTokenById(tokenCurrency) : null;
  const receivingAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;
  const accountAddress = accountToWalletAPIAccount(walletState, account, parentAccount).address;
  return uiNavigation(receivingAccount, parentAccount, accountAddress);
}
