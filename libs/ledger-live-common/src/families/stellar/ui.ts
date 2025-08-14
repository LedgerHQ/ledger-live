import { StellarMemo, StellarOperationExtra } from "./types";

/**
 * Format stellar memo value for display.
 */
export const formatMemo = (extra: StellarOperationExtra): string | undefined => {
  const memo: StellarMemo | string | undefined = extra.memo;

  // for backward compatibility for previous operation structure, as there is no
  // data migration system in place
  // noinspection SuspiciousTypeOfGuard
  if (typeof memo == "string") return memo;

  switch (memo?.type) {
    case "MEMO_ID":
    case "MEMO_TEXT":
    case "MEMO_HASH":
    case "MEMO_RETURN":
      return memo?.value;
  }
  return undefined;
};
