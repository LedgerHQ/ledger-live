import type { Memo } from "../../types";

/**
 * True when the user typed a memo value. An empty or skipped (`NO_MEMO`) memo goes through
 * the skip-memo flow instead, so its bridge status is not a memo validation result.
 */
export function hasTypedMemo(memo: Memo | null | undefined): memo is Memo {
  return Boolean(memo && memo.type !== "NO_MEMO" && memo.value.length > 0);
}
