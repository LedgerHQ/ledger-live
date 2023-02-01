import type { NFTStandard, Operation } from "@ledgerhq/types-live";
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
<<<<<<< HEAD
=======

export function flattenOperationWithInternalsAndNfts(
  op: Operation
): Operation[] {
  let ops: Operation[] = [];

  // ops of type NONE does not appear in lists
  if (op.type !== "NONE") {
    ops.push(op);
  }

  // all internal operations are expanded after the main op
  if (op.internalOperations) {
    ops = ops.concat(op.internalOperations);
  }

  // all nfts operations are expanded after the main op
  if (op.nftOperations) {
    ops = ops.concat(op.nftOperations);
  }

  return ops;
}

export function getOperationAmountNumber(op: Operation): BigNumber {
  switch (op.type) {
    case "IN":
    case "REWARD":
    case "REWARD_PAYOUT":
    case "SUPPLY":
    case "WITHDRAW":
      return op.value;

    case "OUT":
    case "REVEAL":
    case "CREATE":
    case "FEES":
    case "DELEGATE":
    case "REDELEGATE":
    case "UNDELEGATE":
    case "OPT_IN":
    case "OPT_OUT":
    case "REDEEM":
    case "SLASH":
    case "LOCK":
      return op.value.negated();

    case "FREEZE":
    case "UNFREEZE":
    case "VOTE":
    case "BOND":
    case "UNBOND":
    case "WITHDRAW_UNBONDED":
    case "SET_CONTROLLER":
    case "NOMINATE":
    case "CHILL":
    case "REVOKE":
    case "APPROVE":
    case "ACTIVATE":
    case "UNLOCK":
    case "STAKE":
    case "UNSTAKE":
    case "WITHDRAW_UNSTAKED":
      return op.fee.negated();

    default:
      return new BigNumber(0);
  }
}

export function getOperationAmountNumberWithInternals(
  op: Operation
): BigNumber {
  return flattenOperationWithInternalsAndNfts(op).reduce(
    (amount: BigNumber, op) => amount.plus(getOperationAmountNumber(op)),
    new BigNumber(0)
  );
}

export const getOperationConfirmationNumber = (
  operation: Operation,
  account: Account
): number =>
  operation.blockHeight ? account.blockHeight - operation.blockHeight + 1 : 0;

export const getOperationConfirmationDisplayableNumber = (
  operation: Operation,
  account: Account
): string =>
  account.blockHeight && operation.blockHeight && account.currency.blockAvgTime
    ? String(account.blockHeight - operation.blockHeight + 1)
    : "";

export const isConfirmedOperation = (
  operation: Operation,
  account: Account,
  confirmationsNb: number
): boolean =>
  operation.blockHeight
    ? account.blockHeight - operation.blockHeight + 1 >= confirmationsNb
    : false;
>>>>>>> f84b352fd8 (remove useless status attribute in operation)
