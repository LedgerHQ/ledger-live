import { MemoTooLong } from "../../../../errors";

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

type GetMemoTooLongErrorArgs = Readonly<{
  value: string;
  /** Max memo size from the send descriptor, in UTF-8 bytes as chains measure it. */
  maxLength?: number;
  memoType?: string;
}>;

/**
 * Flags a memo larger than the descriptor allows, so the flow can block it instead of
 * truncating it. Tag memos are bounded by memoMaxValue in sanitizeMemoValue instead.
 */
export function getMemoTooLongError({
  value,
  maxLength,
  memoType,
}: GetMemoTooLongErrorArgs): MemoTooLong | undefined {
  if (memoType === "tag" || maxLength === undefined) return undefined;
  const memoByteLength = Buffer.byteLength(value, "utf8");
  if (memoByteLength <= maxLength) return undefined;
  return new MemoTooLong(memoByteLength, maxLength);
}
