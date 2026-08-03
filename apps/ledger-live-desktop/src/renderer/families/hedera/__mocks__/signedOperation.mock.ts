import BigNumber from "bignumber.js";
import type { Operation } from "@ledgerhq/types-live";
import { HEDERA_ACCOUNT_1 } from "./account.mock";

export const mockSignedOperation = {
  signature: "sig",
  operation: {
    id: "op-1",
    hash: "0xabc123",
    type: "OUT" as const,
    value: new BigNumber(0),
    fee: new BigNumber(0),
    senders: [],
    recipients: [],
    blockHeight: null,
    blockHash: null,
    accountId: HEDERA_ACCOUNT_1.id,
    date: new Date(),
    extra: {},
  },
  expirationDate: null,
};

export const mockBroadcastedOperation = mockSignedOperation.operation as unknown as Operation;
