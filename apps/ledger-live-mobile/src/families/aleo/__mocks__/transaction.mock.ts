import BigNumber from "bignumber.js";
import { TRANSACTION_TYPE } from "@ledgerhq/live-common/families/aleo/constants";
import type { Transaction as AleoTransaction } from "@ledgerhq/live-common/families/aleo/types";

export const makeAleoTransaction = (overrides?: Partial<AleoTransaction>): AleoTransaction =>
  ({
    family: "aleo",
    mode: TRANSACTION_TYPE.TRANSFER_PUBLIC,
    recipient: "aleo1abc",
    amount: new BigNumber(100),
    fees: new BigNumber(5),
    useAllAmount: false,
    ...overrides,
  }) as AleoTransaction;

export const makePrivateAleoTransaction = (
  amountRecordCount: number,
  feeRecordCommitment: string | null,
): AleoTransaction =>
  makeAleoTransaction({
    mode: TRANSACTION_TYPE.TRANSFER_PRIVATE,
    properties: {
      amountRecordCommitments: Array.from({ length: amountRecordCount }, (_, i) => `record-${i}`),
      feeRecordCommitment,
    },
  } as Partial<AleoTransaction>);
