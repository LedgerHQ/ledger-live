import { encodeOperationId } from "@ledgerhq/coin-framework/operation";
import { Operation } from "@ledgerhq/types-live";
import { BigNumber } from "bignumber.js";
import { scriptPublicKeyToAddress } from "../logic";
import { KaspaAccount, KaspaHwTransaction } from "../types";

export const buildInitialOperation = (
  account: KaspaAccount,
  transaction: KaspaHwTransaction,
): Operation => {
  const { id } = account;

  const senders = transaction.inputs.map(input => input.address);
  const recipients = transaction.outputs.map(output =>
    scriptPublicKeyToAddress(output.scriptPublicKey),
  );
  const value = BigNumber(transaction.outputs[0].value);
  const type = "OUT";

  const op: Operation = {
    id: encodeOperationId(id, "", type),
    hash: "",
    type,
    value,
    blockHash: null,
    blockHeight: null,
    senders,
    fee: BigNumber(transaction.fee),
    recipients,
    accountId: id,
    date: new Date(),
    extra: {},
  };

  return op;
};

export default buildInitialOperation;
