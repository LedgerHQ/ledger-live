import BigNumber from "bignumber.js";
import { StellarMemoKind } from "../types/bridge";

export const MEMO_TEXT_MAXIMUM_SIZE = 28;
export const MEMO_HASH_FIXED_SIZE = 64;

export function validateMemo(memo: string, type: StellarMemoKind): boolean {
  switch (type) {
    case "NO_MEMO":
      return !memo || memo.length === 0;
    case "MEMO_TEXT":
      return memo.length <= MEMO_TEXT_MAXIMUM_SIZE;
    case "MEMO_ID":
      return !new BigNumber(memo.toString()).isNaN();
    case "MEMO_HASH":
    case "MEMO_RETURN":
      return memo.length === 64;
  }
}
