import { Account, AccountLike, SignedOperation } from "@ledgerhq/types-live";
import {
  getWalletAPITransactionSignFlowInfos,
  getAccountIdFromWalletAccountId,
} from "../converters";
import { WalletAPITransaction } from "../types";
import {
  isTokenAccount,
  getMainAccount,
  getParentAccount,
  makeEmptyTokenAccount,
} from "../../account/index";
import { Transaction } from "../../generated/types";
import { getCryptoAssetsStore } from "@ledgerhq/cryptoassets/state";
import { WalletAPIContext } from "./context";

export async function signTransactionLogic(
  { manifest, accounts, tracking }: WalletAPIContext,
  walletAccountId: string,
  transaction: WalletAPITransaction,
  uiNavigation: (
    account: AccountLike,
    parentAccount: Account | undefined,
    signFlowInfos: {
      canEditFees: boolean;
      hasFeesProvided: boolean;
      liveTx: Partial<Transaction>;
    },
  ) => Promise<SignedOperation>,
  tokenCurrency?: string,
  isEmbeddedSwap?: boolean,
  partner?: string,
): Promise<SignedOperation> {
  tracking.signTransactionRequested(manifest, isEmbeddedSwap, partner);

  if (!transaction) {
    tracking.signTransactionFail(manifest, isEmbeddedSwap, partner);
    throw new Error("Transaction required");
  }

  const accountId = getAccountIdFromWalletAccountId(walletAccountId);
  if (!accountId) {
    tracking.signTransactionFail(manifest, isEmbeddedSwap, partner);
    throw new Error(`accountId ${walletAccountId} unknown`);
  }

  const account = accounts.find(account => account.id === accountId);

  if (!account) {
    tracking.signTransactionFail(manifest, isEmbeddedSwap, partner);
    throw new Error("Account required");
  }

  const parentAccount = getParentAccount(account, accounts);

  const accountFamily = isTokenAccount(account)
    ? parentAccount?.currency.family
    : account.currency.family;

  const mainAccount = getMainAccount(account, parentAccount);
  const currency = tokenCurrency ? await getCryptoAssetsStore().findTokenById(tokenCurrency) : null;
  const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

  const { canEditFees, liveTx, hasFeesProvided } = getWalletAPITransactionSignFlowInfos({
    walletApiTransaction: transaction,
    account: mainAccount,
  });

  if (accountFamily !== liveTx.family) {
    throw new Error(
      `Account and transaction must be from the same family. Account family: ${accountFamily}, Transaction family: ${liveTx.family}`,
    );
  }

  return uiNavigation(signerAccount, parentAccount, {
    canEditFees,
    liveTx,
    hasFeesProvided,
  });
}
