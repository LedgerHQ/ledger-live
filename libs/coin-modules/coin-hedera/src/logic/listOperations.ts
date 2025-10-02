import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import type { CryptoCurrency } from "@ledgerhq/types-cryptoassets";
import type { Pagination } from "@ledgerhq/coin-framework/api/types";
import { findTokenByAddressInCurrency } from "@ledgerhq/cryptoassets/tokens";
import { encodeAccountId, encodeTokenAccountId } from "@ledgerhq/coin-framework/account/accountId";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { hederaMirrorNode } from "../network/mirror";
import { parseTransfers } from "../network/utils";
import type { HederaMirrorToken, HederaOperationExtra } from "../types";
import { base64ToUrlSafeBase64, getMemoFromBase64 } from "./utils";

export async function listOperations({
  currency,
  address,
  mirrorTokens,
  pagination,
}: {
  currency: CryptoCurrency;
  address: string;
  mirrorTokens: HederaMirrorToken[];
  pagination: Pagination;
}): Promise<{
  coinOperations: Operation<HederaOperationExtra>[];
  tokenOperations: Operation<HederaOperationExtra>[];
}> {
  const coinOperations: Operation<HederaOperationExtra>[] = [];
  const tokenOperations: Operation<HederaOperationExtra>[] = [];
  const mirrorTransactions = await hederaMirrorNode.getAccountTransactions({
    address,
    since: pagination.lastPagingToken ?? null,
    order: pagination.order,
    limit: pagination.limit,
  });
  const ledgerAccountId = encodeAccountId({
    type: "js",
    version: "2",
    currencyId: currency.id,
    xpubOrAddress: address,
    derivationMode: "hederaBip44",
  });

  for (const rawTx of mirrorTransactions) {
    const timestamp = new Date(parseInt(rawTx.consensus_timestamp.split(".")[0], 10) * 1000);
    const hash = base64ToUrlSafeBase64(rawTx.transaction_hash);
    const fee = new BigNumber(rawTx.charged_tx_fee);
    const tokenTransfers = rawTx.token_transfers ?? [];
    const transfers = rawTx.transfers ?? [];
    const hasFailed = rawTx.result !== "SUCCESS";
    const blockHeight = 10;
    const blockHash = null;
    const commonExtra: HederaOperationExtra = {
      pagingToken: rawTx.consensus_timestamp,
      consensusTimestamp: rawTx.consensus_timestamp,
      memo: rawTx.memo_base64 ? getMemoFromBase64(rawTx.memo_base64) : null,
    };

    if (tokenTransfers.length > 0) {
      const tokenId = tokenTransfers[0].token_id;
      const token = findTokenByAddressInCurrency(tokenId, currency.id);
      if (!token) continue;

      const encodedTokenId = encodeTokenAccountId(ledgerAccountId, token);
      const { type, value, senders, recipients } = parseTransfers(tokenTransfers, address);
      const extra = { ...commonExtra };

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

  return { coinOperations, tokenOperations };
}
