import { KaspaAccount, KaspaOperation, Transaction } from "../types/bridge";
import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";

export const buildInitialOperation = (
  account: KaspaAccount,
  transaction: Transaction,
): KaspaOperation => {
  const { id } = account;

  const senders = [transaction.recipient];
  const recipients = [transaction.recipient];
  const value = transaction.amount;

  const type = "OUT";

  const op: Operation = {
    id: encodeOperationId(id, "", type),
    hash: "",
    type,
    value,
    fee: 0,
    blockHash: null,
    blockHeight: null,
    senders,
    recipients,
    accountId: id,
    date: new Date(),
    extra: {},
  };

  return op;
};

export default buildInitialOperation;
