import {
  findSubAccountById,
  getMainAccount,
  isTokenAccount,
} from "@ledgerhq/coin-framework/account/index";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { Transaction } from "./types";
import { getAddress, getTonEstimatedFees, transactionToHwParams } from "./utils";

const estimateMaxSpendable = async ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): Promise<BigNumber> => {
  const a = getMainAccount(account, parentAccount);
  let balance = a.spendableBalance;

  if (balance.eq(0)) return balance;

  const accountInfo = await fetchAccountInfo(getAddress(a).address);
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
    subAccount = findSubAccountById(a, transaction.subAccountId || "") ?? null;
  }

  if (tokenAccountTxn && subAccount) {
    return subAccount.spendableBalance;
  }

  const estimatedFees = transaction
    ? transaction.fees ??
      (await getTonEstimatedFees(
        a,
        accountInfo.status === "uninit",
        transactionToHwParams(transaction, accountInfo.seqno, a),
      ))
    : BigNumber(0);

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  return balance;
};

export default estimateMaxSpendable;
