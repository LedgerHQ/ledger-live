/**
 * Orders strings by UTF-16 code unit, like `Array#sort` without a compare function: the order
 * AWS Signature V4 expects, and the same on every machine whatever its locale.
 */
export const byCodeUnit = (a: string, b: string): number => (a < b ? -1 : Number(a > b));
