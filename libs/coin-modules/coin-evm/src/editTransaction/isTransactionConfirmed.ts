import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { getNodeApi } from "../network/node/index";

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
  try {
    const tx = await nodeApi.getTransaction(currency, hash);
    const { blockHeight = null } = tx;
    return typeof blockHeight === "number" && blockHeight > 0;
  } catch (error) {
    const status =
      typeof error === "object" && error !== null ? Reflect.get(error, "status") : undefined;
    const message =
      error instanceof Error
        ? error.message
        : typeof error === "object" && error !== null
          ? Reflect.get(error, "message")
          : undefined;

    if (status === 404 || (typeof message === "string" && message.includes("404"))) {
      return false;
    }
    throw error;
  }
};
