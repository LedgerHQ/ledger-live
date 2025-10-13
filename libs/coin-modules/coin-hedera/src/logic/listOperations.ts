import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { apiClient } from "../network/api";
import { parseTransfers } from "../network/utils";
import type { HederaMirrorToken, HederaOperationExtra } from "../types";
import { base64ToUrlSafeBase64, getMemoFromBase64 } from "./utils";

export async function listOperations({
  currency,
  address,
  mirrorTokens,
  pagination,
  fetchAllPages,
  skipFeesForTokenOperations,
  useEncodedHash,
}: {
  currency: CryptoCurrency;
  address: string;
  mirrorTokens: HederaMirrorToken[];
  pagination: Pagination;
  // options for compatibility with old bridge
  fetchAllPages: boolean;
  skipFeesForTokenOperations: boolean;
  useEncodedHash: boolean;
}): Promise<{
  coinOperations: Operation<HederaOperationExtra>[];
  tokenOperations: Operation<HederaOperationExtra>[];
  nextCursor: string | null;
}> {
  const coinOperations: Operation<HederaOperationExtra>[] = [];
  const tokenOperations: Operation<HederaOperationExtra>[] = [];
  const mirrorResult = await apiClient.getAccountTransactions({
    address,
    pagingToken: pagination.lastPagingToken ?? null,
    order: pagination.order,
    limit: pagination.limit,
    fetchAllPages,
  });
  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "hederaBip44",
  });

  for (const rawTx of mirrorResult.transactions) {
    const timestamp = new Date(parseInt(rawTx.consensus_timestamp.split(".")[0], 10) * 1000);
    const hash = useEncodedHash
      ? base64ToUrlSafeBase64(rawTx.transaction_hash)
      : rawTx.transaction_hash;
    const fee = new BigNumber(rawTx.charged_tx_fee);
    const tokenTransfers = rawTx.token_transfers ?? [];
    const transfers = rawTx.transfers ?? [];
    const hasFailed = rawTx.result !== "SUCCESS";
    const blockHeight = 10;
    const blockHash = null;
    const memo = getMemoFromBase64(rawTx.memo_base64);
    const commonExtra: HederaOperationExtra = {
      pagingToken: rawTx.consensus_timestamp,
      consensusTimestamp: rawTx.consensus_timestamp,
      ...(memo && { memo }),
    };

    if (tokenTransfers.length > 0) {
      const tokenId = tokenTransfers[0].token_id;
      const token = findTokenByAddressInCurrency(tokenId, currency.id);
      if (!token) continue;

      const encodedTokenId = encodeTokenAccountId(ledgerAccountId, token);
      const { type, value, senders, recipients } = parseTransfers(tokenTransfers, address);
      const extra = { ...commonExtra };

      // add main FEES coin operation for send token transfer
      if (type === "OUT" && !skipFeesForTokenOperations) {
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
          extra,
        });
      }

      tokenOperations.push({
        id: encodeOperationId(encodedTokenId, hash, type),
        accountId: encodedTokenId,
        contract: token.contractAddress,
        standard: "hts",
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
        extra,
      });
    } else if (transfers.length > 0) {
      const { type, value, senders, recipients } = parseTransfers(transfers, address);
      const extra = { ...commonExtra };
      let operationType = type;

      // try to enrich ASSOCIATE_TOKEN operation with extra.associatedTokenId
      // this value is used by custom OperationDetails components in Hedera family
      // accounts or contracts must first associate with an HTS token before they can receive or send that token; without association, token transfers fail
      if (rawTx.name === "TOKENASSOCIATE") {
        operationType = "ASSOCIATE_TOKEN";

        const relatedMirrorToken = mirrorTokens.find(t => {
          return t.created_timestamp === rawTx.consensus_timestamp;
        });

        if (relatedMirrorToken) {
          extra.associatedTokenId = relatedMirrorToken.token_id;
        }
      }

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
        extra,
      });
    }
  }

  return {
    coinOperations,
    tokenOperations,
    nextCursor: mirrorResult.nextCursor,
  };
}
