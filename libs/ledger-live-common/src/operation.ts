import type {
  Account,
  AccountLike,
  NFTStandard,
  Operation,
  SubAccount,
} from "@ledgerhq/types-live";
import { decodeAccountId, getMainAccount } from "./account";
import { encodeNftId } from "@ledgerhq/coin-framework/nft/nftId";

import {
  encodeERC1155OperationId,
  encodeERC721OperationId,
} from "./nft/nftOperationId";

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
import { getEnv } from "@ledgerhq/live-env";

const nftOperationIdEncoderPerStandard: Record<
  NFTStandard,
  (...args: any[]) => string
> = {
  ERC721: encodeERC721OperationId,
  ERC1155: encodeERC1155OperationId,
};

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

export function isStuckOperation(
  account: AccountLike,
  operation: Operation
): boolean {
  return (
    isEditableOperation(account, operation) &&
    operation.date.getTime() >
      new Date().getTime() - getEnv("ETHEREUM_STUCK_TRANSACTION_TIMEOUT")
  );
}

export const isOldestEditableOperation = (
  operation: Operation,
  account: AccountLike
): boolean => {
  return (
    isEditableOperation(account, operation) &&
    account.pendingOperations.every((pendingOperation) => {
      return (
        operation.transactionSequenceNumber &&
        pendingOperation.transactionSequenceNumber &&
        operation.transactionSequenceNumber <=
          pendingOperation.transactionSequenceNumber
      );
    })
  );
};

export function getEthStuckAccountAndOperation(
  account: AccountLike | undefined,
  parentAccount: Account | undefined | null
): [
  stuckAccount: AccountLike | undefined,
  stuckParentAccount: Account | undefined,
  stuckOperation: Operation | undefined
] {
  let stuckAccount: AccountLike | undefined;
  let stuckParentAccount: Account | undefined;
  let stuckOperation: Operation | undefined;
  const mainAccount = account
    ? getMainAccount(account, parentAccount)
    : undefined;

  if (mainAccount && mainAccount.currency.family === "ethereum") {
    if (mainAccount.subAccounts && mainAccount.subAccounts.length > 0) {
      mainAccount.subAccounts.forEach((subAccount: SubAccount) => {
        subAccount.pendingOperations.forEach((pendingOperation) => {
          if (
            isEditableOperation(subAccount, pendingOperation) &&
            new Date().getTime() - pendingOperation.date.getTime() >
              getEnv("ETHEREUM_STUCK_TRANSACTION_TIMEOUT")
          ) {
            if (
              !stuckAccount ||
              (pendingOperation.transactionSequenceNumber !== undefined &&
                stuckOperation?.transactionSequenceNumber !== undefined &&
                pendingOperation.transactionSequenceNumber <
                  stuckOperation.transactionSequenceNumber)
            ) {
              stuckAccount = subAccount;
              stuckOperation = pendingOperation;
              stuckParentAccount = mainAccount;
            }
          }
        });
      });
    }

    mainAccount.pendingOperations.forEach((pendingOperation) => {
      if (
        isEditableOperation(mainAccount, pendingOperation) &&
        new Date().getTime() - pendingOperation.date.getTime() >
          getEnv("ETHEREUM_STUCK_TRANSACTION_TIMEOUT")
      ) {
        if (
          !stuckAccount ||
          (pendingOperation.transactionSequenceNumber !== undefined &&
            stuckOperation?.transactionSequenceNumber !== undefined &&
            pendingOperation.transactionSequenceNumber <
              stuckOperation.transactionSequenceNumber)
        ) {
          stuckAccount = mainAccount;
          stuckOperation = pendingOperation;
          stuckParentAccount = undefined;
        }
      }
    });
  }
  return [stuckAccount, stuckParentAccount, stuckOperation];
}
