import BigNumber from "bignumber.js";

const DECIMAL = /^[+-]?(\d+(\.\d*)?|\.\d+)(e[+-]?\d+)?$/i;
const HEX = /^[+-]?0x[0-9a-f]+$/i;

export function parseFiniteBigNumber(
  value: unknown,
  { allowHex = false }: { allowHex?: boolean } = {},
): BigNumber | undefined {
  let input: BigNumber.Value;
  if (typeof value === "string") {
    input = value.trim();
    if (!DECIMAL.test(input) && !(allowHex && HEX.test(input))) return undefined;
  } else if (typeof value === "bigint") {
    input = value.toString();
  } else if (typeof value === "number" || BigNumber.isBigNumber(value)) {
    input = value;
  } else {
    return undefined;
  }
  const bn = new BigNumber(input);
  return bn.isFinite() ? bn : undefined;
}

const NAN_OR_INFINITY = /^[+-]?(NaN|Infinity)$/;

/** Rehydrates a persisted BigNumber string without throwing (bignumber.js STRICT mode): returns `fallback` for missing or non-numeric values, keeps "NaN" / "Infinity". */
export function fromRawBigNumber(raw: unknown, fallback: BigNumber.Value = 0): BigNumber {
  if (BigNumber.isBigNumber(raw)) return new BigNumber(raw);
  const input =
    typeof raw === "string" ? raw.trim() : typeof raw === "number" ? String(raw) : undefined;
  if (
    input !== undefined &&
    (DECIMAL.test(input) || HEX.test(input) || NAN_OR_INFINITY.test(input))
  ) {
    return new BigNumber(input);
  }
  return new BigNumber(fallback);
}
