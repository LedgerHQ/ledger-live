import { getMainAccount, isTokenAccount } from "@ledgerhq/coin-framework/account/index";
import type { Account, AccountLike, TokenAccount } from "@ledgerhq/types-live";
import type { Transaction } from "../../types";
import { getSubAccount } from "./token";

export const getAccountInfo = ({
  account,
  parentAccount,
  transaction,
}: {
  account: AccountLike;
  parentAccount?: Account | null | undefined;
  transaction?: Transaction | null | undefined;
}): {
  mainAccount: Account;
  subAccount: TokenAccount | undefined | null;
  isTokenType: boolean;
  tokenAccountTxn: boolean;
} => {
  const mainAccount = getMainAccount(account, parentAccount);

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
    subAccount = getSubAccount(mainAccount, transaction) ?? null;
  }

  return {
    mainAccount,
    subAccount,
    isTokenType,
    tokenAccountTxn,
  };
};
