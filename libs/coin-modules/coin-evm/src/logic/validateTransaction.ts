import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { ethers } from "ethers";
import { InvalidTransactionError } from "../errors";
import { getNodeApi } from "../network/node";
import { getSequence } from "./getSequence";

export async function validateTransaction(
  currency: CryptoCurrency,
  { signature }: { signature: string },
): Promise<{ error: Error | undefined }> {
  const nodeApi = getNodeApi(currency);
  const transaction = ethers.Transaction.from(signature);

  if (transaction.hash) {
    try {
      const { hash, blockHeight = null } = await nodeApi.getTransaction(currency, transaction.hash);
      if (blockHeight || hash) {
        return { error: new InvalidTransactionError() };
      }
    } catch {
      // eslint-disable-next-line no-empty
    }
  }

  if (transaction.from) {
    const currentNonce = await getSequence(currency, transaction.from);
    if (typeof transaction.nonce === "number") {
      const txNonce = BigInt(transaction.nonce);
      if (txNonce < currentNonce) {
        return {
          error: new InvalidTransactionError(),
        };
      }
    }
  }

  return { error: undefined };
}
