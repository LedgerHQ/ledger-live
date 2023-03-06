import type { NFTStandard, Operation, AccountLike } from "@ledgerhq/types-live";
import { decodeAccountId } from "./account";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";
import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "./nft/nftOperationId";

const nftOperationIdEncoderPerStandard: Record<
  NFTStandard,
  (...args: any[]) => string
> = {
  ERC721: encodeERC721OperationId,
  ERC1155: encodeERC1155OperationId,
};

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
};

export function patchOperationWithHash(
  operation: Operation,
  hash: string
): Operation {
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
          currencyId
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

export function isEditableOperation(
  account: AccountLike,
  operation: Operation
): boolean {
  let isEthFamily = false;
  if (account.type === "Account") {
    isEthFamily = account.currency.family === "ethereum";
  } else if (account.type === "TokenAccount") {
    isEthFamily = account.token.parentCurrency.family === "ethereum";
  }
  return (
    isEthFamily && operation.blockHeight === null && !!operation.transactionRaw
  );
}
