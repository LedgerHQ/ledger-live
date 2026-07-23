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
import { Transaction } from "../../coin-modules/transaction-types";
import { getCryptoAssetsStore } from "@ledgerhq/ledger-wallet-framework/cryptoAssetsStore";
import { WalletAPIContext } from "./context";
import { withLiveAppContext } from "../blindSigningContext";

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
  swapEntryPoint?: string,
): Promise<SignedOperation> {
  return withLiveAppContext(manifest, async () => {
    tracking.signTransactionRequested(manifest, isEmbeddedSwap, partner, swapEntryPoint);

    if (!transaction) {
      tracking.signTransactionFail(manifest, isEmbeddedSwap, partner, swapEntryPoint);
      throw new Error("Transaction required");
    }

    const accountId = getAccountIdFromWalletAccountId(walletAccountId);
    if (!accountId) {
      tracking.signTransactionFail(manifest, isEmbeddedSwap, partner, swapEntryPoint);
      throw new Error(`accountId ${walletAccountId} unknown`);
    }

    const account = accounts.find(account => account.id === accountId);

    if (!account) {
      tracking.signTransactionFail(manifest, isEmbeddedSwap, partner, swapEntryPoint);
      throw new Error("Account required");
    }

    const parentAccount = getParentAccount(account, accounts);

    const accountFamily = isTokenAccount(account)
      ? parentAccount?.currency.family
      : account.currency.family;

    const mainAccount = getMainAccount(account, parentAccount);
    const currency = tokenCurrency
      ? await getCryptoAssetsStore().findTokenById(tokenCurrency)
      : null;
    const signerAccount = currency ? makeEmptyTokenAccount(mainAccount, currency) : account;

    const { canEditFees, liveTx, hasFeesProvided } = await getWalletAPITransactionSignFlowInfos({
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
  });
}
