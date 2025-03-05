import { OperationType } from "@ledgerhq/types-live";
import { getAddress } from "./bridgeHelpers/addresses";
import { CasperAccount, CasperOperation, Transaction } from "../types";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

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
    value: transaction.amount.plus(transaction.fees),
    fee: transaction.fees,
    blockHash: null,
    blockHeight: null,
    date: new Date(),
    extra: {
      transferId: transaction.transferId,
    },
  };
};
