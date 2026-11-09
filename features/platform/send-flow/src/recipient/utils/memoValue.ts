type SanitizeMemoValueArgs = Readonly<{
  value: string;
  /** Memo input kind coming from the send descriptor (ex "tag" restricts to digits). */
  memoType?: string;
  /** Max numeric value for tag memos, from the send descriptor. */
  memoMaxValue?: number | bigint;
}>;

/**
 * Normalizes a raw memo input value according to descriptor-driven constraints.
 * For "tag" memos the value is restricted to digits and clamped to memoMaxValue.
 * Family-agnostic: behavior is driven by descriptor metadata, not by family names.
 */
export function sanitizeMemoValue({
  value,
  memoType,
  memoMaxValue,
}: SanitizeMemoValueArgs): string {
  if (memoType !== "tag") return value;

  const digitsOnly = value.replace(/\D/g, "");
  if (memoMaxValue === undefined || digitsOnly === "") return digitsOnly;

  const maxBig = BigInt(memoMaxValue);
  const valueBig = BigInt(digitsOnly);
  return valueBig > maxBig ? String(memoMaxValue) : digitsOnly;
}
