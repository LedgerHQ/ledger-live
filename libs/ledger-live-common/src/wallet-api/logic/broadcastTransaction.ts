import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "../converters";
import { getMainAccount, getParentAccount, makeEmptyTokenAccount } from "../../account/index";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { WalletAPIContext } from "./context";

export async function broadcastTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  signedOperation: SignedOperation,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signedOperation: SignedOperation,
  ) => Promise<string>,
  tokenCurrency?: string,
): Promise<string> {
  if (!signedOperation) {
    tracking.broadcastFail(manifest);
    throw new Error("Transaction required");
  }

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.broadcastFail(manifest);
    throw new Error(`accountId ${walletAccountId} unknown`);
  }

  const account = accounts.find(account => account.id === accountId);
  if (!account) {
    tracking.broadcastFail(manifest);
    throw new Error("Account required");
  }

  const currency = tokenCurrency ? await getCryptoAssetsStore().findTokenById(tokenCurrency) : null;
  const parentAccount = getParentAccount(account, accounts);
  const mainAccount = getMainAccount(account, parentAccount);
  const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

  return uiNavigation(signerAccount, parentAccount, signedOperation);
}
