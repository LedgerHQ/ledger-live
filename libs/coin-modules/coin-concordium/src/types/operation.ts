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
 * `FEES` is a CCD operation that moved nothing but the fee the account paid. The
 * `NONE`/`FEES` parent of a PLT transfer is another thing, built in `bridge/`.
 */
export interface RawOperation {
  hash: string;
  type: "OUT" | "IN" | "FEES";
  sender: string;
  recipient: string;
  amount: string;
  /** The microCCD this account paid: 0 when another account paid. */
  fee: string;
  /**
   * The microCCD the transaction cost, the same in every account's view. A proxy
   * older than 0.51.0 shows an unsponsored cost to the sender alone: others get 0.
   */
  transactionFee: string;
  value: string;
  memo: string | undefined;
  date: Date;
  blockHash: string | null;
  blockHeight: number;
  failed: boolean;
  id: number;
  /** The sponsor, else the sender: whoever paid the cost. Absent when the proxy names none. */
  feesPayer?: string;
  tokenId?: string;
  decimals?: number;
  /** Set only on a rejected PLT transfer whose reason this layer could narrow. */
  rejectCode?: PltRejectCode;
}
