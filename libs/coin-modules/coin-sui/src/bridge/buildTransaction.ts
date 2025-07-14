import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import type { SuiAccount, Transaction } from "../types";
import { craftTransaction } from "../logic";

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  account: SuiAccount,
  { recipient, mode, amount, coinType, subAccountId }: Transaction,
) => {
  const { freshAddress } = account;
  const subAccount = findSubAccountById(account, subAccountId ?? "");
  const asset = subAccount
    ? { type: "token" as const, coinType: subAccount?.token.contractAddress }
    : { type: "native" as const };

  return craftTransaction({
    sender: freshAddress,
    recipient,
    type: mode,
    coinType,
    amount: BigInt(amount.toString()),
    asset,
  });
};
