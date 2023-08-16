import invariant from "invariant";
import { BigNumber } from "bignumber.js";
import { getEnv } from "@ledgerhq/live-env";
import type { Account, AccountLike, NFTStandard, Operation } from "@ledgerhq/types-live";
import { encodeERC1155OperationId, encodeERC721OperationId } from "./nft/nftOperationId";
import { findSubAccountById, getMainAccount } from "./account/helpers";
import { decodeAccountId } from "./account";
import { encodeNftId } from "./nft/nftId";

const nftOperationIdEncoderPerStandard: Record<NFTStandard, (...args: any[]) => string> = {
  erc721: encodeERC721OperationId,
  erc1155: encodeERC1155OperationId,
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
            nftOperationIdEncoderPerStandard.erc721;

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

export function isEditableOperation(account: AccountLike, operation: Operation): boolean {
  let isEvmFamily = false;
  if (account.type === "Account") {
    isEvmFamily = account.currency.family === "evm";
  } else if (account.type === "TokenAccount") {
    isEvmFamily = account.token.parentCurrency.family === "evm";
  }

  return isEvmFamily && operation.blockHeight === null && !!operation.transactionRaw;
}

// return the oldest stuck pending operation and its corresponding account according to a eth account or a token subaccount. If no stuck pending operation is found, return undefined
export function getStuckAccountAndOperation(
  account: AccountLike,
  parentAccount: Account | undefined | null,
):
  | {
      account: AccountLike;
      parentAccount: Account | undefined;
      operation: Operation;
    }
  | undefined {
  let stuckAccount;
  let stuckParentAccount;
  const mainAccount = getMainAccount(account, parentAccount);

  const SUPPORTED_FAMILIES = ["evm"];

  if (!SUPPORTED_FAMILIES.includes(mainAccount.currency.family)) {
    return undefined;
  }

  const now = new Date().getTime();
  const stuckOperations = mainAccount.pendingOperations.filter(
    pendingOp =>
      isEditableOperation(mainAccount, pendingOp) &&
      now - pendingOp.date.getTime() > getEnv("ETHEREUM_STUCK_TRANSACTION_TIMEOUT"),
  );

  if (stuckOperations.length === 0) {
    return undefined;
  }

  const oldestStuckOperation = stuckOperations.reduce((oldestOp, currentOp) => {
    if (!oldestOp) return currentOp;
    return oldestOp.transactionSequenceNumber !== undefined &&
      currentOp.transactionSequenceNumber !== undefined &&
      oldestOp.transactionSequenceNumber > currentOp.transactionSequenceNumber
      ? currentOp
      : oldestOp;
  });

  if (oldestStuckOperation?.transactionRaw?.subAccountId) {
    stuckAccount = findSubAccountById(
      mainAccount,
      oldestStuckOperation.transactionRaw.subAccountId,
    );
    stuckParentAccount = mainAccount;
  } else {
    stuckAccount = mainAccount;
    stuckParentAccount = undefined;
  }

  invariant(stuckAccount, "stuckAccount required");

  return {
    account: stuckAccount,
    parentAccount: stuckParentAccount,
    operation: oldestStuckOperation,
  };
}
