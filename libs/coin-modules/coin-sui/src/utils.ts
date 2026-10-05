/**
 * Ensures that the address is in the format `0x...`
 * @param addr The address to ensure the format of
 * @returns The address in the format `0x...`
 */
export function ensureAddressFormat(addr: string): `0x${string}` {
  return (addr?.startsWith("0x") ? addr : `0x${addr}`) as `0x${string}`;
}

/**
 * Normalize a Sui address for equality checks against RPC `AddressOwner` values.
 * Ensures `0x` prefix and lowercase hex so account-derived and RPC strings match.
 */
export function normalizeSuiAddressForComparison(addr: string): string {
  return ensureAddressFormat(addr).toLowerCase();
}

/**
 * Normalize a Sui struct tag (coin type / event type / object id) to short form:
 * strip leading zeros from each `0x` address segment (incl. nested generics), lowercase the
 * hex, preserve `module::Name` casing. E.g. `0x0…02::sui::SUI` → `0x2::sui::SUI`.
 *
 * Keeps every transport's output byte-identical so downstream `===` checks
 * (DEFAULT_COIN_TYPE, the staking-event constants) match. CAL stores the long form, so pad with
 * {@link toLongStructTag} before a CAL lookup. NB: the inverse of `@mysten/sui/utils`'
 * `normalizeStructTag` (which pads to long form) — don't swap it in. See LIVE-32040.
 */
export function toShortStructTag(structTag: string): string {
  return structTag.replace(/0x0*([0-9a-fA-F]+)/g, (_full, hex: string) => `0x${hex.toLowerCase()}`);
}

/** Pads every `0x` address in a struct tag to 64 digits, the form CAL stores for Sui tokens. */
export function toLongStructTag(structTag: string): string {
  return structTag.replace(
    /(?<!\w)0x([0-9a-fA-F]{1,64})(?=::)/g,
    (_full, hex: string) => `0x${hex.toLowerCase().padStart(64, "0")}`,
  );
}
