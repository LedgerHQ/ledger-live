import { BigNumber } from "bignumber.js";

export type JsonValue =
  | null
  | boolean
  | number
  | string
  | JsonValue[]
  | { [key: string]: JsonValue };

/**
 * The JSON form of `value`, as the portfolio layer stores module data: bigints and BigNumbers become
 * decimal strings, dates ISO strings, `undefined` fields are dropped. A local copy of
 * `@ledgerhq/account-module-framework`'s `toJsonSafe`, which a coin module may not import.
 */
export function toJsonSafe(value: unknown): JsonValue {
  const json = JSON.stringify(value, function (this: Record<string, unknown>, key, replaced) {
    // The value before its own `toJSON` ran: BigNumber's may use exponent notation.
    const raw = this[key];
    if (typeof raw === "bigint") return raw.toString();
    // Duck-typed (`_isBigNumber`), so a BigNumber of another copy of bignumber.js counts too.
    if (BigNumber.isBigNumber(raw)) return raw.toFixed();
    return replaced;
  });
  return json === undefined ? null : (JSON.parse(json) as JsonValue);
}
