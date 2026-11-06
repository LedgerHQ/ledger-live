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
