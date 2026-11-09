type ShouldShowMatchedAddressArgs = Readonly<{
  showMatchedAddress: boolean;
  hasMemo: boolean;
  hasFilledMemo: boolean;
  hasMemoError: boolean;
}>;

/**
 * Decides whether the matched-address row can be shown.
 * On chains without a memo it shows as soon as the address is valid; on memo chains it waits until
 * the memo is filled (or explicitly skipped) and error-free. Family-agnostic: the "hasMemo" input
 * is resolved from the send descriptor by the caller.
 */
export function shouldShowMatchedAddress({
  showMatchedAddress,
  hasMemo,
  hasFilledMemo,
  hasMemoError,
}: ShouldShowMatchedAddressArgs): boolean {
  if (!showMatchedAddress) return false;
  if (!hasMemo) return true;
  return hasFilledMemo && !hasMemoError;
}
