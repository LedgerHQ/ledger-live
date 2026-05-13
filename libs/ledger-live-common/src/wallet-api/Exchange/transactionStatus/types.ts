export type TransactionStatusInput = {
  swapId: string;
  provider?: string;
};

export type TransactionStatusValue =
  | "pending"
  | "onhold"
  | "expired"
  | "finished"
  | "refunded"
  | "unknown";

export type GetTransactionStatusArgs = TransactionStatusInput & {
  signal?: AbortSignal;
};

export type GetTransactionStatusWireArgs = Omit<GetTransactionStatusArgs, "signal">;

export type GetTransactionStatusResponse = {
  kind: "swap";
  swapId: string;
  provider?: string;
  status?: TransactionStatusValue;
  finalAmount?: string;
  fromAccountId?: string;
  toAccountId?: string;
  sentAmount?: string;
  receivedAmount?: string;
  feesAmount?: string;
  operationHash?: string;
  createdAt?: number;
  providerRequired?: boolean;
};
