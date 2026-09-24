/**
 * Why the chain refused a PLT transfer.
 *
 * Closed because the module reject `type` it is derived from is not — see
 * `logic/history/pltRejectCode.ts` for which values map here and why.
 */
export const PLT_REJECT_CODES = [
  "nonExistentToken",
  "recipientNotFound",
  "insufficientBalance",
  "rejected",
] as const;

export type PltRejectCode = (typeof PLT_REJECT_CODES)[number];

const PLT_REJECT_CODE_SET: ReadonlySet<string> = new Set(PLT_REJECT_CODES);

/** Narrows a code read back off a stored operation, where nothing is typed. */
export function isPltRejectCode(value: unknown): value is PltRejectCode {
  return typeof value === "string" && PLT_REJECT_CODE_SET.has(value);
}

/**
 * `tokenId` marks a PLT operation; it, `decimals` and `rejectCode` are absent on
 * CCD ones.
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
  /** Set only on a rejected PLT transfer whose reason this layer could narrow. */
  rejectCode?: PltRejectCode;
}
