import {
  findSubAccountById,
  getMainAccount,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import type { Account, AccountBridge, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { Transaction } from "./types";
import { buildTonTransaction, getTonEstimatedFees } from "./utils";

const estimateMaxSpendable: AccountBridge<Transaction, Account>["estimateMaxSpendable"] = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const mainAccount = getMainAccount(account, parentAccount);
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

  const estimatedFees = transaction
    ? transaction.fees ??
      (await getTonEstimatedFees(
        mainAccount,
        accountInfo.status === "uninit",
        buildTonTransaction(transaction, accountInfo.seqno, mainAccount),
      ))
    : BigNumber(0);

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  return balance;
};

export default estimateMaxSpendable;
