import { getNodeApi } from "@ledgerhq/coin-evm/network/node/index";
import type { AccountLike } from "@ledgerhq/types-live";

/**
 * Check if a transaction has been confirmed on the network
 * A confirmed transaction has been included in a block and
 * therefore have a blockHeight.
 * If the transaction is not confirmed, the blockHeight is null or undefined.
 *
 * Ledger explorer may return HTTP 404 for a hash that is not indexed yet (e.g. right after
 * broadcast). Treat that as "not confirmed" so wait-for-confirmation polling can continue.
 */
export const isTransactionConfirmed = async ({
  account,
  hash,
}: {
  account: AccountLike;
  hash: string;
}): Promise<boolean> => {
  if (account.type !== "Account") {
    return false;
  }
  const nodeApi = getNodeApi(account.currency);

  try {
    const { blockHeight = null } = await nodeApi.getTransaction(account.currency, hash);
    return blockHeight !== null;
  } catch (e: unknown) {
    const err = e as { name?: string; status?: number } | null | undefined;
    if (err?.name === "LedgerAPI4xx" && err?.status === 404) {
      return false;
    }
    throw e;
  }
};
