import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { BigNumber } from "bignumber.js";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import type { SuiAccount, Transaction } from "../types";
import { calculateAmount } from "./utils";
import { estimateFees } from "../logic";
import { DEFAULT_COIN_TYPE, toSuiAsset } from "../network/sdk";

/**
 * Fetch the transaction fees for a transaction
 *
 * @param {Object} params
 * @param {SuiAccount} params.account - The account to estimate fees for
 * @param {Transaction} params.transaction - The transaction to estimate fees for
 * @returns {Promise<BigNumber>} The estimated fees
 */
export default async function getEstimatedFees({
  account,
  transaction,
}: {
  account: SuiAccount;
  transaction: Transaction;
}): Promise<BigNumber> {
  const t = {
    ...transaction,
    recipient: getAbandonSeedAddress(account.currency.id),
    // Always use a fake recipient to estimate fees
    amount: calculateAmount({
      account,
      transaction: {
        ...transaction,
        fees: new BigNumber(transaction.fees || 0),
      },
    }), // Remove fees if present since we are fetching fees
  };

  const subAccount = findSubAccountById(account, transaction.subAccountId ?? "");
  const asset = toSuiAsset(subAccount?.token.contractAddress ?? DEFAULT_COIN_TYPE);

  const fees = await estimateFees({
    recipient: getAbandonSeedAddress(account.currency.id),
    sender: account.freshAddress,
    amount: BigInt(t.amount.toString()),
    type: "send",
    asset,
  });
  return new BigNumber(fees.toString());
}
