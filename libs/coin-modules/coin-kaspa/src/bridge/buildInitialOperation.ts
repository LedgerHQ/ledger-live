import { KaspaAccount, KaspaTransaction } from "../types/bridge";
import { encodeOperationId } from "@ledgerhq/coin-framework/lib/operation";
import { Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";

export const buildInitialOperation = (
  account: KaspaAccount,
  transaction: KaspaTransaction,
): Operation => {
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
    blockHash: null,
    blockHeight: null,
    senders,
    fee: BigNumber(0),
    recipients,
    accountId: id,
    date: new Date(),
    extra: {},
  };

  return op;
};

export default buildInitialOperation;
