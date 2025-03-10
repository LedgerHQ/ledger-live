import { getMainAccount, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import type { Account, AccountBridge, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { TonAccount, Transaction } from "./types";
import { buildTonTransaction, findSubAccountById, getTonEstimatedFees } from "./utils";

const estimateMaxSpendable: AccountBridge<
  Transaction,
  TonAccount
>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount) as TonAccount;
  let balance = mainAccount.spendableBalance;

  if (balance.eq(0)) return balance;

  const accountInfo = await fetchAccountInfo(mainAccount.freshAddress);
  const isTokenType = isTokenAccount(account);

  if (transaction && !transaction.subAccountId) {
    transaction.subAccountId = isTokenType ? account.id : null;
  }

  let tokenAccountTxn: boolean = false;
  let subAccount: TokenAccount | undefined | null;
  if (isTokenType) {
    tokenAccountTxn = true;
    subAccount = account;
  }
  if (transaction?.subAccountId && !subAccount) {
    tokenAccountTxn = true;
    subAccount = findSubAccountById(mainAccount, transaction.subAccountId || "") ?? null;
  }

  if (tokenAccountTxn && subAccount) {
    return subAccount.spendableBalance;
  }

  let estimatedFees = BigNumber(0);
  if (transaction) {
    const tonTx = buildTonTransaction(transaction, accountInfo.seqno, mainAccount);
    estimatedFees = await getTonEstimatedFees(mainAccount, accountInfo.status === "uninit", tonTx);
  }

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  return balance;
};

export default estimateMaxSpendable;
