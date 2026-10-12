import type { AccountLike } from "@ledgerhq/types-live";

/**
 * Best-effort local check for BTC transaction confirmation.
 *
 * Returns true **only if** the transaction is known to be confirmed in the locally-synced account
 * data; false when it is unconfirmed or not found locally.
 *
 * This function does NOT guarantee on-chain confirmation.
 */
export async function isTransactionConfirmed({
  account,
  hash,
}: {
  account: AccountLike;
  hash: string;
}): Promise<boolean> {
  return account.operations.some(
    op => op.hash === hash && typeof op.blockHeight === "number" && op.blockHeight > 0,
  );
}
