import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import { getAccountIdFromWalletAccountId } from "../converters";
import { getParentAccount } from "../../account/index";
import { WalletAPIContext } from "./context";

export function signRawTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  transaction: string,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    transaction: string,
  ) => Promise<SignedOperation>,
): Promise<SignedOperation> {
  tracking.signRawTransactionRequested(manifest);

  if (!transaction) {
    tracking.signRawTransactionFail(manifest);
    throw new Error("Transaction required");
  }

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.signRawTransactionFail(manifest);
    throw new Error(`accountId ${walletAccountId} unknown`);
  }

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.signRawTransactionFail(manifest);
    throw new Error("Account required");
  }

  const parentAccount = getParentAccount(account, accounts);

  return uiNavigation(account, parentAccount, transaction);
}
