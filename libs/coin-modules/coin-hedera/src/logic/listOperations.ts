import { Operation } from "@ledgerhq/types-live";
import { mirrorNode } from "../network/mirror";
import { Pagination } from "@ledgerhq/coin-framework/api/types";
import { base64ToUrlSafeBase64 } from "../bridge/utils";
import BigNumber from "bignumber.js";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { parseTransfers } from "../network/utils";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

export async function listOperations({
  address,
  pagination,
  ledgerAccountId = address,
}: {
  address: string;
  pagination: Pagination;
  ledgerAccountId?: string;
}): Promise<{
  coinOperations: Operation[];
  tokenOperations: Operation[];
}> {
  console.log("called listOperations", { address, pagination, ledgerAccountId });
  const coinOperations: Operation[] = [];
  const tokenOperations: Operation[] = [];
  const mirrorTransactions = await mirrorNode.getAccountTransactions({
    address,
    since: pagination.lastPagingToken ?? null,
    order: pagination.order,
    limit: pagination.limit,
  });

  for (const rawTx of mirrorTransactions) {
    const timestamp = new Date(parseInt(rawTx.consensus_timestamp.split(".")[0], 10) * 1000);
    const hash = base64ToUrlSafeBase64(rawTx.transaction_hash);
    const fee = new BigNumber(rawTx.charged_tx_fee);
    const tokenTransfers = rawTx.token_transfers ?? [];
    const transfers = rawTx.transfers ?? [];
    const hasFailed = rawTx.result !== "SUCCESS";
    const blockHeight = 5;
    const blockHash = null;
    const commonExtra = {
      consensusTimestamp: rawTx.consensus_timestamp,
    };

    if (tokenTransfers.length > 0) {
      const tokenId = rawTx.token_transfers[0].token_id;
      const token = findTokenByAddressInCurrency(tokenId, "hedera");
      if (!token) continue;

      const encodedTokenId = encodeTokenAccountId(ledgerAccountId, token);
      const { type, value, senders, recipients } = parseTransfers(rawTx.token_transfers, address);

      // add main FEES coin operation for send token transfer
      if (type === "OUT") {
        coinOperations.push({
          id: encodeOperationId(ledgerAccountId, hash, "FEES"),
          accountId: ledgerAccountId,
          type: "FEES",
          value: fee,
          recipients,
          senders,
          hash,
          fee,
          date: timestamp,
          blockHeight,
          blockHash,
          hasFailed,
          extra: commonExtra,
        });
      }

      tokenOperations.push({
        id: encodeOperationId(encodedTokenId, hash, type),
        accountId: encodedTokenId,
        type,
        value,
        recipients,
        senders,
        hash,
        fee,
        date: timestamp,
        blockHeight,
        blockHash,
        hasFailed,
        extra: commonExtra,
      });
    } else if (transfers.length > 0) {
      const { type, value, senders, recipients } = parseTransfers(rawTx.transfers, address);
      const operationType = rawTx.name === "TOKENASSOCIATE" ? "ASSOCIATE_TOKEN" : type;

      coinOperations.push({
        id: encodeOperationId(ledgerAccountId, hash, operationType),
        accountId: ledgerAccountId,
        type: operationType,
        value,
        recipients,
        senders,
        hash,
        fee,
        date: timestamp,
        blockHeight,
        blockHash,
        hasFailed,
        extra: commonExtra,
      });
    }
  }

  return { coinOperations, tokenOperations };
}
