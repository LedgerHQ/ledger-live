import estimateMaxSpendable from "./js-estimateMaxSpendable";
import BigNumber from "bignumber.js";
import type { Account } from "../../types";
import type { Transaction } from "./types";

// NOTE: Hedera declares stable fees in USD
//       If we can get the current USD/HBAR price here..
//       > transfer fee is 0.0001 USD
export const estimatedFees = new BigNumber("83300"); // 0.000833 ℏ (as of 2021-09-20)
export const estimatedFeeSafetyRate = 2;

export async function calculateAmount({
  account,
  transaction,
}: {
  account: Account;
  transaction: Transaction;
}): Promise<{
  amount: BigNumber;
  totalSpent: BigNumber;
}> {
  const amount =
    transaction.useAllAmount === true
      ? await estimateMaxSpendable({ account })
      : transaction.amount;

  return {
    amount,
    totalSpent: amount.plus(estimatedFees),
  };
}

// NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
export function base64ToUrlSafeBase64(data: string) {
  // Might be nice to use this alternative if .nvmrc changes to >= Node v14.18.0
  // base64url encoding option isn't supported until then
  // Buffer.from(data, "base64").toString("base64url");

  return data.replace(/\//g, "_").replace(/\+/g, "-");
}
