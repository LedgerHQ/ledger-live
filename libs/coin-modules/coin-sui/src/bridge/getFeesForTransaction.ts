import { findSubAccountById } from "@ledgerhq/ledger-wallet-framework/account/helpers";
import { BigNumber } from "bignumber.js";
import { SUI_DUMMY_ADDRESS } from "../constants";
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
}): Promise<{ fees: BigNumber; gasBudget: BigNumber }> {
  const t = {
    ...transaction,
    recipient: SUI_DUMMY_ADDRESS,
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

  const { fees, gasBudget } = await estimateFees({
    intentType,
    recipient: SUI_DUMMY_ADDRESS,
    sender: account.freshAddress,
    amount: BigInt(t.amount.toString()),
    type: transactionType,
    asset,
    currencyId: account.currency.id,
    ...(transaction.useAllAmount !== undefined && { useAllAmount: transaction.useAllAmount }),
    ...(transaction.stakedSuiId !== undefined && { stakedSuiId: transaction.stakedSuiId }),
  });
  return {
    fees: new BigNumber(fees.toString()),
    gasBudget: new BigNumber(gasBudget.toString()),
  };
}
