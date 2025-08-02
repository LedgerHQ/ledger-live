import { StellarOperationExtra } from "./types";

/**
 * Format stellar memo value for display.
 */
export const formatMemo = (extra: StellarOperationExtra): string | undefined => {
  switch (extra?.memo?.type) {
    case "MEMO_ID":
    case "MEMO_TEXT":
    case "MEMO_HASH":
    case "MEMO_RETURN":
      return extra?.memo.value;
  }
  return undefined;
};
