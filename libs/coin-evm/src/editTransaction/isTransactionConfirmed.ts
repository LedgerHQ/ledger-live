import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../api/node/index";

/**
 * Check if a transaction has been confirmed on the network
 * A confirmed transaction has been included in a block and
 * therefore have a blockHeight.
 * If the transaction is not confirmed, the blockHeight is null or undefined.
 */
export const isTransactionConfirmed = async ({
  currency,
  hash,
}: {
  currency: CryptoCurrency;
  hash: string;
}): Promise<boolean> => {
  const nodeApi = getNodeApi(currency);

  const { blockHeight = null } = await nodeApi.getTransaction(currency, hash);

  return blockHeight !== null;
};
