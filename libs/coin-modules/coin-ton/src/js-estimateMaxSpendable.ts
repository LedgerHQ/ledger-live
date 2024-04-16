import { getMainAccount } from "@ledgerhq/coin-framework/account/index";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { fetchAccountInfo } from "./bridge/bridgeHelpers/api";
import type { Transaction } from "./types";
import { getAddress, getSubAccount, getTonEstimatedFees, transactionToHwParams } from "./utils";

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

  if (transaction && !transaction.subAccountId) {
    transaction.subAccountId = account.type === "Account" ? null : account.id;
  }

  let tokenAccountTxn: boolean = false;
  let subAccount: TokenAccount | undefined | null;
  if (account.type === "TokenAccount") {
    tokenAccountTxn = true;
    subAccount = account;
  }
  if (transaction?.subAccountId && !subAccount) {
    tokenAccountTxn = true;
    subAccount = getSubAccount(transaction, a) ?? null;
  }

  const estimatedFees = transaction
    ? transaction.fees ??
      (await getTonEstimatedFees(
        a,
        accountInfo.status === "uninit",
        transactionToHwParams(transaction, accountInfo.seqno),
      ))
    : BigNumber(0);

  if (balance.lte(estimatedFees)) return new BigNumber(0);

  balance = balance.minus(estimatedFees);

  if (tokenAccountTxn && subAccount) {
    return subAccount.spendableBalance;
  }

  return balance;
};

export default estimateMaxSpendable;
