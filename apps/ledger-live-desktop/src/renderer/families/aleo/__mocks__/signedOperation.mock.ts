import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { ALEO_MAIN_ACCOUNT } from "./account.mock";

export const mockSignedOperation = {
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
  expirationDate: null,
};

export const mockBroadcastedOperation = mockSignedOperation.operation as unknown as Operation;
