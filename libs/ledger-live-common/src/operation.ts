import type { NFTStandard, Operation } from "@ledgerhq/types-live";
import { decodeAccountId } from "./account";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";

import { encodeERC1155OperationId, encodeERC721OperationId } from "./nft/nftOperationId";

import {
  findOperationInAccount,
  encodeOperationId,
  decodeOperationId,
  encodeSubOperationId,
  decodeSubOperationId,
  flattenOperationWithInternalsAndNfts,
  getOperationAmountNumber,
  getOperationAmountNumberWithInternals,
  getOperationConfirmationNumber,
  getOperationConfirmationDisplayableNumber,
  isConfirmedOperation,
  patchOperationWithHash as commonPatchOperationWithHash,
  isAddressPoisoningOperation,
  isEditableOperation,
  getStuckAccountAndOperation,
} from "@ledgerhq/coin-framework/operation";

export {
  findOperationInAccount,
  encodeOperationId,
  decodeOperationId,
  encodeSubOperationId,
  decodeSubOperationId,
  flattenOperationWithInternalsAndNfts,
  getOperationAmountNumber,
  getOperationAmountNumberWithInternals,
  getOperationConfirmationNumber,
  getOperationConfirmationDisplayableNumber,
  isConfirmedOperation,
  isAddressPoisoningOperation,
  isEditableOperation,
  getStuckAccountAndOperation,
};

const nftOperationIdEncoderPerStandard: Record<NFTStandard, (...args: any[]) => string> = {
  ERC721: encodeERC721OperationId,
  ERC1155: encodeERC1155OperationId,
};

export function patchOperationWithHash(operation: Operation, hash: string): Operation {
  const commonOperation = commonPatchOperationWithHash(operation, hash);

  return {
    ...commonOperation,
    nftOperations:
      operation.nftOperations &&
      operation.nftOperations.map((nftOp, i) => {
        const { currencyId } = decodeAccountId(operation.accountId);
        const nftId = encodeNftId(
          operation.accountId,
          nftOp.contract || "",
          nftOp.tokenId || "",
          currencyId,
        );
        const nftOperationIdEncoder =
          nftOperationIdEncoderPerStandard[nftOp?.standard || ""] ||
          nftOperationIdEncoderPerStandard.ERC721;

        return {
          ...nftOp,
          hash,
          id: nftOperationIdEncoder(nftId, hash, nftOp.type, 0, i),
        };
      }),
  };
}
