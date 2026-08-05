export type A4Tag = { key: string; value: string };

export type A4SyncStatus = "Uninitialized" | "Waiting" | "Synchronized";

export type A4AccountView = {
  id: string;
  createdAt: string;
  tags?: A4Tag[];
  version: string;
  status: A4SyncStatus;
};

export type A4BlockView = {
  hash: string;
  height: number;
  time: string;
};

export type A4Tx = {
  hash: string;
  index?: number;
  details?: Record<string, unknown>;
};

export type A4OperationTransfer = {
  type: "transfer";
  address: string;
  peer?: string;
  asset: string;
  amount: string;
};

export type A4OperationFee = {
  type: "fee";
  address: string;
  asset: string;
  amount: string;
};

export type A4OperationEvent = {
  type: "event";
  address: string;
  eventPath: string;
  eventData: unknown;
};

export type A4OperationPart = A4OperationTransfer | A4OperationFee | A4OperationEvent;

export type A4OperationView = {
  block?: A4BlockView;
  tx: A4Tx;
  assets: Record<string, string>;
  events: Record<string, unknown>;
  failed: boolean;
  fees: string;
  feeAsset: string;
  feePayer?: string;
  addresses?: string[];
  senders?: string[];
  recipients?: string[];
  parts?: A4OperationPart[];
};

export type A4ListOperationsParams = {
  blocks?: [number, number | "latest" | "pending"];
  size?: number;
  order?: "ASC" | "DESC";
  token?: string;
};

export type A4ListOperationsResponse = {
  items: A4OperationView[];
  nextToken?: string;
};

export type A4BalanceValue = string;

export type A4BalanceView = {
  assets: Record<string, A4BalanceValue>;
};

export type A4Result<T> = { data: T; version: string | undefined };
