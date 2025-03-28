import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import type { Account, AccountLike, NFTStandard, Operation } from "@ledgerhq/types-live";
import { encodeERC1155OperationId, encodeERC721OperationId } from "./nft/nftOperationId";
import { decodeAccountId } from "./account";
import { encodeNftId } from "./nft/nftId";

const nftOperationIdEncoderPerStandard: Record<NFTStandard, (...args: any[]) => string> = {
  ERC721: encodeERC721OperationId,
  ERC1155: encodeERC1155OperationId,
  // Fallback for SPL on NFTStandard type using ERC721O encode
  // as we don't support sending currently
  SPL: encodeERC721OperationId,
};

export function findOperationInAccount(
  { operations, pendingOperations }: AccountLike,
  operationId: string,
): Operation | null | undefined {
  for (let i = 0; i < operations.length; i++) {
    const op = operations[i];
    if (op.id === operationId) return op;

    if (op.internalOperations) {
      const internalOps = op.internalOperations;

      for (let j = 0; j < internalOps.length; j++) {
        const internalOp = internalOps[j];
        if (internalOp.id === operationId) return internalOp;
      }
    }

    if (op.nftOperations) {
      const nftOps = op.nftOperations;

      for (let j = 0; j < nftOps.length; j++) {
        const nftOp = nftOps[j];

        if (nftOp.id === operationId) return nftOp;
      }
    }
  }

  for (let i = 0; i < pendingOperations.length; i++) {
    const op = pendingOperations[i];
    if (op.id === operationId) return op;

    if (op.nftOperations) {
      const nftOps = op.nftOperations;

      for (let j = 0; j < nftOps.length; j++) {
        const nftOp = nftOps[j];

        if (nftOp.id === operationId) return nftOp;
      }
    }
  }

  return null;
}

export function encodeOperationId(accountId: string, hash: string, type: string): string {
  return `${accountId}-${hash}-${type}`;
}

export function decodeOperationId(id: string): {
  accountId: string;
  hash: string;
  type: string;
} {
  const [accountId, hash, type] = id.split("-");
  return {
    accountId,
    hash,
    type,
  };
}

export function encodeSubOperationId(
  accountId: string,
  hash: string,
  type: string,
  index: string | number,
): string {
  return `${accountId}-${hash}-${type}-i${index}`;
}

export function decodeSubOperationId(id: string): {
  accountId: string;
  hash: string;
  type: string;
  index: number;
} {
  const [accountId, hash, type, index] = id.split("-");
  return {
    accountId,
    hash,
    type,
    index: Number(index),
  };
}

export function patchOperationWithHash(operation: Operation, hash: string): Operation {
  return {
    ...operation,
    hash,
    id: encodeOperationId(operation.accountId, hash, operation.type),
    subOperations: operation.subOperations
      ? operation.subOperations.map(op => ({
          ...op,
          hash,
          id: encodeOperationId(op.accountId, hash, op.type),
        }))
      : [],
    nftOperations: operation.nftOperations
      ? operation.nftOperations.map((nftOp, i) => {
          const { currencyId } = decodeAccountId(operation.accountId);
          const nftId = encodeNftId(
            operation.accountId,
            nftOp.contract || "",
            nftOp.tokenId || "",
            currencyId,
          );
          const nftOperationIdEncoder =
            nftOperationIdEncoderPerStandard[(nftOp?.standard as NFTStandard) || ""] ||
            nftOperationIdEncoderPerStandard.ERC721;

          return {
            ...nftOp,
            hash,
            id: nftOperationIdEncoder(nftId, hash, nftOp.type, 0, i),
          };
        })
      : [],
  };
}

export function flattenOperationWithInternalsAndNfts(op: Operation): Operation[] {
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
    case "SLASH":
    case "LOCK":
    case "BURN":
      return op.value.negated();

    case "FREEZE":
    case "UNFREEZE":
    case "UNDELEGATE_RESOURCE":
    case "WITHDRAW_EXPIRE_UNFREEZE":
    case "LEGACY_UNFREEZE":
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

export function getOperationAmountNumberWithInternals(op: Operation): BigNumber {
  return flattenOperationWithInternalsAndNfts(op).reduce(
    (amount: BigNumber, op) => amount.plus(getOperationAmountNumber(op)),
    new BigNumber(0),
  );
}

export const getOperationConfirmationNumber = (operation: Operation, account: Account): number =>
  operation.blockHeight ? account.blockHeight - operation.blockHeight + 1 : 0;

export const getOperationConfirmationDisplayableNumber = (
  operation: Operation,
  account: Account,
): string =>
  account.blockHeight && operation.blockHeight && account.currency.blockAvgTime
    ? String(account.blockHeight - operation.blockHeight + 1)
    : "";

export const isConfirmedOperation = (
  operation: Operation,
  account: Account,
  confirmationsNb: number,
): boolean =>
  operation.blockHeight
    ? account.blockHeight - operation.blockHeight + 1 >= confirmationsNb
    : false;

export const isAddressPoisoningOperation = (
  operation: Operation,
  account: AccountLike,
): boolean => {
  const impactedFamilies = getEnv("ADDRESS_POISONING_FAMILIES").split(",");
  const isTokenAccount = account.type === "TokenAccount";

  return (
    isTokenAccount &&
    impactedFamilies.includes(account.token.parentCurrency.family) &&
    operation.value.isZero()
  );
};

/**
 * @param account The account of the transaction to edit
 * @param nonce The nouce of the transaction to edit
 * @returns true if the nonce corresponds to the oldest pending operation
 */
export const isOldestPendingOperation = (account: Account, nonce: number): boolean => {
  /**
   * The selected pending operation is the oldest if there is no pending
   * operation with a lower transactionSequenceNumber
   */
  return !account.pendingOperations.some(pendingOp => {
    /**
     * the pending operation must have a transactionSequenceNumberat this stage
     * since it should have previously been broadcasted
     */
    invariant(
      pendingOp.transactionSequenceNumber !== undefined,
      "transactionSequenceNumber required",
    );

    return pendingOp.transactionSequenceNumber < nonce;
  });
};
