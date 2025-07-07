export type Transaction<Op extends Operation> = {
  hash: string;
  value: bigint;
  failed: boolean;
  operations: Op[];
  details?: Record<string, unknown>;
  fee: bigint;
  feePayer: string;
};

export type Operation = Transfer | Fee;

export type Transfer = {
  type: "transfer";
  from: string;
  to: string;
  asset: Record<string, unknown>;
};

export type Fee = {
  type: "fee";
  amount: bigint;
  asset: Record<string, unknown>;
};
