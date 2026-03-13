import type { BlockTransaction, Page } from "@ledgerhq/coin-framework/api/index";
import { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import { rpcTransactionToBlockOperations } from "../adapters/blockOperations";
import { getNodeApi } from "../network/node";

export async function getPendingTransactions(
  currency: CryptoCurrency,
  address: string,
): Promise<Page<BlockTransaction>> {
  const nodeApi = getNodeApi(currency);
  const transactions = await nodeApi.getPendingTransactions(currency, address);
  const items = transactions.map(transaction => {
    const failed = transaction.status === 0;
    const fees = BigInt(transaction.gasUsed) * BigInt(transaction.gasPrice);
    const operations = rpcTransactionToBlockOperations(transaction);

    return {
      hash: transaction.hash,
      failed,
      operations,
      fees,
      feesPayer: transaction.from,
      details: { sequence: transaction.nonce },
    };
  });

  return { items };
}
