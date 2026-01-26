import { BigNumber } from "bignumber.js";
import type { Operation, TransactionCommonRaw } from "@ledgerhq/types-live";
import { encodeOperationId } from "@ledgerhq/coin-framework/operation";

type BuildOptimisticOperationParams = {
  accountId: string;
  fee: BigNumber;
  value?: BigNumber;
  senders?: string[];
  recipients?: string[];
  extra?: Record<string, unknown>;
  transactionRaw?: TransactionCommonRaw;
};

export const buildOptimisticOperation = ({
  accountId,
  fee,
  value,
  senders = [],
  recipients = [],
  extra = {},
  transactionRaw,
}: BuildOptimisticOperationParams): Operation => ({
  id: encodeOperationId(accountId, "", "OUT"),
  hash: "",
  type: "OUT",
  value: value ?? fee,
  fee,
  blockHash: null,
  blockHeight: null,
  senders,
  recipients,
  accountId,
  date: new Date(),
  extra,
  ...(transactionRaw ? { transactionRaw } : {}),
});
