import BigNumber from "bignumber.js";
import invariant from "invariant";
import type { Account, Operation } from "@ledgerhq/types-live";
import cvsApi from "@ledgerhq/live-countervalues/api/index";
import { getFiatCurrencyByTicker } from "@ledgerhq/cryptoassets";
import { makeLRUCache, seconds } from "@ledgerhq/live-network/cache";
import { Currency } from "@ledgerhq/types-cryptoassets";
import { estimateMaxSpendable } from "./estimateMaxSpendable";
import { isValidExtra } from "../logic";
import type { HederaOperationExtra, HederaOperationType, Transaction } from "../types";

const ESTIMATED_FEE_SAFETY_RATE = 2;
const TINYBAR_SCALE = 8;
const BASE_USD_FEE_BY_OPERATION_TYPE: Record<HederaOperationType, number> = {
  CryptoTransfer: 0.0001 * 10 ** TINYBAR_SCALE,
  CryptoUpdate: 0.00022 * 10 ** TINYBAR_SCALE,
} as const;

// note: this is currently called frequently by getTransactionStatus; LRU cache prevents duplicated requests
export const getCurrencyToUSDRate = makeLRUCache(
  async (currency: Currency) => {
    try {
      const [rate] = await cvsApi.fetchLatest([
        {
          from: currency,
          to: getFiatCurrencyByTicker("USD"),
          startDate: new Date(),
        },
      ]);

      invariant(rate, "no value returned from cvs api");

      return new BigNumber(rate);
    } catch {
      return null;
    }
  },
  currency => currency.ticker,
  seconds(3),
);

export const getEstimatedFees = async (
  account: Account,
  operationType: HederaOperationType,
): Promise<BigNumber> => {
  try {
    const usdRate = await getCurrencyToUSDRate(account.currency);

    if (usdRate) {
      return new BigNumber(BASE_USD_FEE_BY_OPERATION_TYPE[operationType])
        .dividedBy(new BigNumber(usdRate))
        .integerValue(BigNumber.ROUND_CEIL)
        .multipliedBy(ESTIMATED_FEE_SAFETY_RATE);
    }
    // eslint-disable-next-line no-empty
  } catch {}

  // as fees are based on a currency conversion, we stay
  // on the safe side here and double the estimate for "max spendable"
  return new BigNumber("150200").multipliedBy(ESTIMATED_FEE_SAFETY_RATE); // 0.001502 ℏ (as of 2023-03-14)
};

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
    totalSpent: amount.plus(await getEstimatedFees(account, "CryptoTransfer")),
  };
}

// NOTE: convert from the non-url-safe version of base64 to the url-safe version (that the explorer uses)
export function base64ToUrlSafeBase64(data: string): string {
  // Might be nice to use this alternative if .nvmrc changes to >= Node v14.18.0
  // base64url encoding option isn't supported until then
  // Buffer.from(data, "base64").toString("base64url");

  return data.replace(/\//g, "_").replace(/\+/g, "-");
}

export const applyPendingExtras = (existing: Operation[], pending: Operation[]) => {
  const pendingOperationsByHash = new Map(pending.map(op => [op.hash, op]));

  return existing.map(op => {
    const pendingOp = pendingOperationsByHash.get(op.hash);
    if (!pendingOp) return op;
    if (!isValidExtra(op.extra)) return op;
    if (!isValidExtra(pendingOp.extra)) return op;

    return {
      ...op,
      extra: {
        ...pendingOp.extra,
        ...op.extra,
      },
    };
  });
};

export function patchOperationWithExtra(
  operation: Operation,
  extra: HederaOperationExtra,
): Operation {
  return {
    ...operation,
    extra,
    subOperations: (operation.subOperations ?? []).map(op => ({ ...op, extra })),
    nftOperations: (operation.nftOperations ?? []).map(op => ({ ...op, extra })),
  };
}
