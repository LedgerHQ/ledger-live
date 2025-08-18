import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import type { SuiAccount, Transaction } from "../types";
import { craftTransaction } from "../logic";
import { DEFAULT_COIN_TYPE, toSuiAsset } from "../network/sdk";

/**
 * @param {Account} account
 * @param {Transaction} transaction
 */
export const buildTransaction = async (
  account: SuiAccount,
  { amount, mode, recipient, subAccountId }: Transaction,
) => {
  const { freshAddress } = account;
  const subAccount = findSubAccountById(account, subAccountId ?? "");
  const asset = toSuiAsset(subAccount?.token.contractAddress ?? DEFAULT_COIN_TYPE);

  return craftTransaction({
    amount: BigInt(amount.toString()),
    asset,
    recipient,
    sender: freshAddress,
    type: mode,
  });
};
