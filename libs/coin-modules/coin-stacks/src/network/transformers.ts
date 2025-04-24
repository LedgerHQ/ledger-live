import { TransactionResponse } from "./api.types";

/**
 * Extracts token transfer transactions from a transaction list
 */
export const extractTokenTransferTransactions = (
  transactions: TransactionResponse[],
): TransactionResponse[] => {
  return transactions.filter(t => t.tx?.tx_type === "token_transfer");
};

/**
 * Extracts send-many transactions from a transaction list
 */
export const extractSendManyTransactions = (
  transactions: TransactionResponse[],
): TransactionResponse[] => {
  return transactions.filter(
    t => t.tx?.tx_type === "contract_call" && t.tx.contract_call?.function_name === "send-many",
  );
};

/**
 * Extracts and groups contract transactions by token ID
 */
export const extractContractTransactions = (
  transactions: TransactionResponse[],
): Record<string, TransactionResponse[]> => {
  const contractTxsMap: Record<string, TransactionResponse[]> = {};

  for (const tx of transactions) {
    // Skip non-contract transactions
    if (tx.tx?.tx_type !== "contract_call") continue;

    // Handle send-many operations (they're processed separately)
    if (tx.tx.contract_call?.function_name === "send-many") continue;

    // Process only transfer function calls
    if (tx.tx.contract_call?.function_name === "transfer") {
      const contractId = tx.tx.contract_call?.contract_id;
      if (!contractId) continue;

      // Skip transactions without post_conditions
      if (!tx.tx.post_conditions || tx.tx.post_conditions.length === 0) continue;

      const assetName = tx.tx.post_conditions.find(p => p.type === "fungible")?.asset.asset_name;
      // Skip if we couldn't find an asset name from post_conditions
      if (!assetName) continue;

      const tokenId = `${contractId}::${assetName}`;

      // Group by token ID
      if (!contractTxsMap[tokenId]) {
        contractTxsMap[tokenId] = [];
      }
      contractTxsMap[tokenId].push(tx);
    }
  }

  return contractTxsMap;
};
