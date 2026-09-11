import { encodeOperationId } from "@ledgerhq/ledger-wallet-framework/operation";
import { OperationType } from "@ledgerhq/types-live";
import { CasperAccount, CasperOperation, Transaction } from "../types";
import { getEstimatedFees } from "../logic/estimateFees";
import { getAddress } from "../logic/validateAddress";

export const buildOptimisticOperation = (
  account: CasperAccount,
  transaction: Transaction,
  hash: string,
  operationType: OperationType = "OUT",
): CasperOperation => {
  const { id: accountId } = account;
  const { address } = getAddress(account);

  return {
    id: encodeOperationId(accountId, hash, operationType),
    hash,
    type: operationType,
    senders: [address],
    recipients: [transaction.recipient],
    accountId,
    value: transaction.amount.plus(transaction.fees ?? getEstimatedFees()),
    fee: transaction.fees ?? getEstimatedFees(),
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {
      ...(transaction.transferId !== undefined && { transferId: transaction.transferId }),
    },
    nftOperations: [],
    subOperations: [],
  };
};
