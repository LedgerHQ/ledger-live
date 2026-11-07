import type { Transaction } from "@ledgerhq/wallet-api-core";
import type { BalanceAssetId } from "@domain/entity-account-balance";
import { SendRequestSchema, type SendRequest } from "@domain/entity-account-transaction";
import { NotServedByAccountDataError } from "./routeHandlers";

/** The fields a plain transfer carries on every network; a memo travels under one of the memo keys. */
const TRANSFER_KEYS = new Set(["family", "amount", "recipient"]);
const MEMO_KEYS = ["memo", "tag", "comment"];

const memoOf = (transaction: Record<string, unknown>): string | undefined => {
  for (const key of MEMO_KEYS) {
    const value = transaction[key];
    if (typeof value === "string" || typeof value === "number") return String(value);
    if (value && typeof value === "object" && "value" in value) return String(value.value);
  }
  return undefined;
};

/** A Wallet API transaction as a send request, when it is a plain transfer with at most a memo. */
export function toSendRequest(assetId: BalanceAssetId, transaction: Transaction): SendRequest {
  const fields: Record<string, unknown> = { ...transaction };
  const extra = Object.keys(fields).filter(
    key => fields[key] !== undefined && !TRANSFER_KEYS.has(key) && !MEMO_KEYS.includes(key),
  );
  if (extra.length > 0) {
    throw new NotServedByAccountDataError(
      `A ${transaction.family} transaction with ${extra.join(", ")} is not a plain transfer`,
    );
  }
  const memo = memoOf(fields);
  const parsed = SendRequestSchema.safeParse({
    assetId,
    recipient: transaction.recipient,
    amount: transaction.amount.toFixed(0),
    ...(memo !== undefined && { memo }),
  });
  if (!parsed.success) throw new NotServedByAccountDataError(parsed.error.message);
  return parsed.data;
}
