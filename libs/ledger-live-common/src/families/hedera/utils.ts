import estimateMaxSpendable from "./js-estimateMaxSpendable";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";

// NOTE: Hedera declares stable fees in USD
//       We could get more accurate fee estimations using network calls
//       to https://countervalues.live.ledger.com/latest/direct?pairs=hbar:usd
//       However, this would create 4 points of failure in the integration tests.
//       While viable, this could create undue pressure on CI for incoming PR's.
//       > transfer fee is $0.0001 USD (10_000 * hedera_price to get the fee in tinybar)
export const estimatedFeeSafetyRate = 2;
export const estimatedFees = new BigNumber("150200"); // 0.001502 ℏ (as of 2023-03-14)

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
  const amount = transaction.useAllAmount
    ? await estimateMaxSpendable({ account })
    : transaction.amount;
    
  return {
    amount,
    totalSpent: amount.plus(estimatedFees),
  };
}

// NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
export function base64ToUrlSafeBase64(data: string): string {
  // Might be nice to use this alternative if .nvmrc changes to >= Node v14.18.0
  // base64url encoding option isn't supported until then
  // Buffer.from(data, "base64").toString("base64url");

  return data.replace(/\//g, "_").replace(/\+/g, "-");
}
