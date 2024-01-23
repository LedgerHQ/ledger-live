import type { Account } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import estimateMaxSpendable from "./js-estimateMaxSpendable";
import type { Transaction } from "./types";
import { getFiatCurrencyByTicker } from "../../currencies/index";
import cvsApi from "@ledgerhq/live-countervalues/api/index";

export const estimatedFeeSafetyRate = 2;

export async function getEstimatedFees(account: Account): Promise<BigNumber> {
  try {
    const data = await cvsApi.fetchLatest([
      {
        from: account.currency,
        to: getFiatCurrencyByTicker("USD"),
        startDate: new Date(),
      },
    ]);

    if (data[0]) {
      return new BigNumber(10000)
        .dividedBy(new BigNumber(data[0]))
        .integerValue(BigNumber.ROUND_CEIL);
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // as fees are based on a currency conversion, we stay
  // on the safe side here and double the estimate for "max spendable"
  return new BigNumber("150200").multipliedBy(estimatedFeeSafetyRate); // 0.001502 ℏ (as of 2023-03-14)
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
    totalSpent: amount.plus(await getEstimatedFees(account)),
  };
}

// NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
export function base64ToUrlSafeBase64(data: string): string {
  // Might be nice to use this alternative if .nvmrc changes to >= Node v14.18.0
  // base64url encoding option isn't supported until then
  // Buffer.from(data, "base64").toString("base64url");

  return data.replace(/\//g, "_").replace(/\+/g, "-");
}
