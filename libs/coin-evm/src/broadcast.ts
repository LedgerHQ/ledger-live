import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "@ledgerhq/coin-framework/nft/nftOperationId";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import type { AccountBridge, Operation } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Transaction as EvmTransaction } from "./types";
import { broadcastTransaction } from "./api/rpc";

/**
 * Broadcast a transaction and update the operation linked
 */
export const broadcast: AccountBridge<EvmTransaction>["broadcast"] = async ({
  account,
  signedOperation: { signature, operation },
}) => {
  const txResponse = await broadcastTransaction(account.currency, signature);

  return {
    ...operation,
    id: encodeOperationId(operation.accountId, txResponse.hash, operation.type),
    hash: txResponse.hash,
    blockNumber: txResponse.blockNumber,
    blockHeight: txResponse.blockNumber,
    blockHash: txResponse.blockHash,
    date: new Date(txResponse.timestamp ? txResponse.timestamp * 1000 : Date.now()),
    subOperations:
      operation.subOperations?.map(subOp => ({
        ...subOp,
        id: encodeOperationId(subOp.accountId, txResponse.hash, subOp.type),
        hash: txResponse.hash,
        blockNumber: txResponse.blockNumber,
        blockHeight: txResponse.blockNumber,
        blockHash: txResponse.blockHash,
        date: new Date(txResponse.timestamp ? txResponse.timestamp * 1000 : Date.now()),
      })) || [],
    nftOperations:
      operation.nftOperations?.map(nftOp => {
        const nftId = encodeNftId(
          nftOp.accountId,
          nftOp.contract || "",
          nftOp.tokenId || "",
          account.currency.id,
        );

        return {
          ...nftOp,
          id:
            nftOp.standard === "ERC721"
              ? encodeERC721OperationId(nftId, txResponse.hash, nftOp.type, 0)
              : encodeERC1155OperationId(nftId, txResponse.hash, nftOp.type, 0),
          hash: txResponse.hash,
          blockNumber: txResponse.blockNumber,
          blockHeight: txResponse.blockNumber,
          blockHash: txResponse.blockHash,
          date: new Date(txResponse.timestamp ? txResponse.timestamp * 1000 : Date.now()),
        };
      }) || [],
  } as Operation;
};

export default broadcast;
