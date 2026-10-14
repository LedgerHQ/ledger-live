import type { AccountIntent, CoinIntent } from "@ledgerhq/account-module-framework";
import type { AssetInfo } from "@ledgerhq/coin-module-framework/api/types";
import {
  PortfolioApiError,
  type TransactionIntentView,
} from "@ledgerhq/portfolio-module-framework";

/** A decimal string of base units; BAD_REQUEST otherwise. */
export function parseAmount(value: string, field: string): bigint {
  try {
    return BigInt(value);
  } catch {
    throw new PortfolioApiError("BAD_REQUEST", `Invalid ${field} ${value}`);
  }
}

const toAssetInfo = (asset: string | undefined): AssetInfo =>
  asset === undefined || asset === "native"
    ? { type: "native" }
    : { type: "token", assetReference: asset };

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

/**
 * The coin module intent of a service intent. An object `networkParams` is spread into it first:
 * it carries what a network needs beyond the common fields (memo, useAllAmount, data...), and the
 * common fields win over it.
 */
export function toCoinIntent(intent: TransactionIntentView): CoinIntent {
  return {
    ...(isRecord(intent.networkParams) ? intent.networkParams : {}),
    intentType: "transaction",
    type: intent.type,
    sender: intent.sender,
    recipient: intent.recipient ?? "",
    amount: parseAmount(intent.amount ?? "0", "amount"),
    asset: toAssetInfo(intent.asset),
    ...(intent.senderPublicKey === undefined ? {} : { senderPublicKey: intent.senderPublicKey }),
    ...(intent.feesStrategy === undefined ? {} : { feesStrategy: intent.feesStrategy }),
  };
}

/** The account module intent: the sender is the account key, the module derives the addresses. */
export function toAccountIntent(intent: TransactionIntentView): AccountIntent {
  const { sender, ...accountIntent } = toCoinIntent(intent);
  return accountIntent;
}
