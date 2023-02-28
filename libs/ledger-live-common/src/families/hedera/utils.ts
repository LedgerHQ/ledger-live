import estimateMaxSpendable from "./js-estimateMaxSpendable";
import BigNumber from "bignumber.js";
import type { Account } from "@ledgerhq/types-live";
import type { Transaction } from "./types";
import axios from "axios";

export const estimatedFeeSafetyRate = 2;

export async function getEstimatedFees(): Promise<BigNumber> {
  // If get hedera price works, use real estimate, otherwise fallback to hard coded
  let hederaPrice;

  try {
    const { data } = await axios.get(
      "https://countervalues.live.ledger.com/latest/direct?pairs=hbar:usd"
    );
    if (data[0]) {
      const hederaPrice = new BigNumber(data[0]);
      return new BigNumber("0.0001").dividedBy(hederaPrice);
    }
  } catch {}
  
  return new BigNumber("212800"); // 0.002128 ℏ (as of 2023-01-09)
}

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
