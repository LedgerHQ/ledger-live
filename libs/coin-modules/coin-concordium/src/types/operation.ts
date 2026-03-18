export interface RawOperation {
  hash: string;
  type: "OUT" | "IN";
  sender: string;
  recipient: string;
  amount: string;
  fee: string;
  value: string;
  memo: string | undefined;
  date: Date;
  blockHash: string | null;
  blockHeight: number;
  failed: boolean;
  id: number;
}
