/**
 * `tokenId` marks a PLT operation; it and `decimals` are absent on CCD ones.
 *
 * `type` stays the movement: the `NONE`/`FEES` parent stand-in is built in
 * `bridge/`, and widening this would leak it into the `api/` surface.
 */
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
  tokenId?: string;
  decimals?: number;
}
