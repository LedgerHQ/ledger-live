import { LedgerAPI4xx } from "@ledgerhq/errors";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node/index";

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
  currency,
  hash,
}: {
  currency: CryptoCurrency;
  hash: string;
}): Promise<boolean> => {
  const nodeApi = getNodeApi(currency);

  try {
    const { blockHeight = null } = await nodeApi.getTransaction(currency, hash);
    return blockHeight !== null;
  } catch (e: unknown) {
    if (e instanceof LedgerAPI4xx && e.status === 404) {
      return false;
    }
    throw e;
  }
};
