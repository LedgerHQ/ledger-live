import type { Memo } from "../../types";
import { hasTypedMemo } from "./hasTypedMemo";

type IsMemoValidationPendingArgs = Readonly<{
  hasMemo: boolean;
  memo: Memo | null | undefined;
  bridgePending: boolean;
}>;

/**
 * True while a typed memo/tag is not yet validated by the bridge status, so the recipient
 * step can hold "Continue" until the memo is known to be valid instead of letting the
 * error surface on the amount step.
 */
export function isMemoValidationPending({
  hasMemo,
  memo,
  bridgePending,
}: IsMemoValidationPendingArgs): boolean {
  return hasMemo && bridgePending && hasTypedMemo(memo);
}
