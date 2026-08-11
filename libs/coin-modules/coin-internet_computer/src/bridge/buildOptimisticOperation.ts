import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { Account, OperationType } from "@ledgerhq/types-live";
import BigNumber from "bignumber.js";
import { InternetComputerOperation, TRANSFER_TYPES, Transaction } from "../types";
import { getAddress } from "./bridgeHelpers/addresses";

export const buildOptimisticOperation = async (
  account: Account,
  transaction: Transaction,
  hash: string,
  operationType: OperationType = "OUT",
): Promise<InternetComputerOperation> => {
  const { id: accountId } = account;
  const { recipient, amount } = transaction;
  const { address } = getAddress(account);

  // Governance calls don't debit the ledger, so they carry no fee/value (matches getTransactionStatus).
  const isTransfer = TRANSFER_TYPES.has(transaction.type);
  const fee = isTransfer ? transaction.fees : new BigNumber(0);
  const value = isTransfer ? amount.plus(fee) : new BigNumber(0);

  return {
    id: encodeOperationId(accountId, hash, operationType),
    hash,
    type: operationType,
    senders: [address],
    recipients: isTransfer ? [recipient] : [],
    accountId,
    value,
    fee,
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {
      // memo belongs only to ledger-canister transfers; don't persist a stale one on governance ops.
      ...(isTransfer && { memo: transaction.memo }),
      // Present for every non-send op (governance and transfer-based staking); types the confirmed
      // operation for display.
      ...(transaction.type !== "send" && { methodName: transaction.type }),
    },
  };
};
