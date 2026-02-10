import { findSubAccountById } from "@ledgerhq/coin-framework/account/helpers";
import { getAbandonSeedAddress } from "@ledgerhq/cryptoassets";
import { BigNumber } from "bignumber.js";
import { estimateFees } from "../logic";
import { DEFAULT_COIN_TYPE, toSuiAsset } from "../network/sdk";
import type { SuiAccount, Transaction } from "../types";
import { calculateAmount } from "./utils";

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

  let transactionType: "send" | "delegate" | "undelegate";
  let intentType: "transaction" | "staking" = "transaction";
  switch (transaction.mode) {
    case "delegate":
      transactionType = "delegate";
      intentType = "staking";
      break;
    case "undelegate":
      transactionType = "undelegate";
      intentType = "staking";
      break;
    default:
      transactionType = "send";
      break;
  }

  const fees = await estimateFees({
    intentType,
    recipient: getAbandonSeedAddress(account.currency.id),
    sender: account.freshAddress,
    amount: BigInt(t.amount.toString()),
    type: transactionType,
    asset,
  });
  return new BigNumber(fees.toString());
}
