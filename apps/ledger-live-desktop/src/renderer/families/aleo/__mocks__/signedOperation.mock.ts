import BigNumber from "bignumber.js";
import type { Operation, SignedOperation } from "@ledgerhq/types-live";
import { ALEO_MAIN_ACCOUNT } from "./account.mock";

export const mockSignedOperation: SignedOperation = {
  signature: "sig",
  operation: {
    id: "op-1",
    hash: "0xabc",
    type: "OUT",
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: ALEO_MAIN_ACCOUNT.id,
    date: new Date(),
    extra: {},
  },
  expirationDate: undefined,
};

export const mockBroadcastedOperation: Operation = mockSignedOperation.operation;
