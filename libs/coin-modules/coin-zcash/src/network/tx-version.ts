/**
 * Transaction version reporting for logs.
 *
 * Deliberately dependency-free so both the renderer (`ZCashIPC.ts`) and the
 * host engine (`engine.ts`) can use it — the renderer must never import
 * `engine.ts`, which pulls in the native `@ledgerhq/zcash-utils` addon.
 */

/** Exactly one little-endian u32, as 8 hex characters. */
const U32_HEX = /^[0-9a-fA-F]{8}/;

/** Reads 8 hex characters as a little-endian u32. Caller must validate the hex. */
function leU32(hex8: string): number {
  return Number.parseInt(
    hex8.slice(6, 8) + hex8.slice(4, 6) + hex8.slice(2, 4) + hex8.slice(0, 2),
    16,
  );
}

/**
 * Reads the transaction version out of a serialized transaction's header.
 *
 * The first 4 bytes are the header (little-endian; the top bit marks
 * "overwintered" and the low 31 bits are the version), the next 4 the version
 * group id. A Zcash send finalizes to V5 (Orchard/transparent) or V6
 * (Ironwood, NU6.3) depending on which pool it spends, and consumers of the
 * bytes reject the version they don't expect — so which one was produced is
 * the first thing worth knowing when a downstream step fails.
 *
 * Never throws, and never guesses: this annotates logs — including the log
 * written on a failure path, where the bytes are already suspect — so it must
 * neither become a failure path itself nor report a version it did not read.
 * Each field is validated as hex before being parsed, because
 * `Number.parseInt` is deliberately lenient: it accepts a valid *prefix*, plus
 * leading whitespace and a sign, and so would turn one bad nibble into a
 * confidently wrong version.
 */
export function describeTxVersion(txHex: string): string {
  if (!U32_HEX.test(txHex)) {
    return txHex.length < 8 ? "unknown (header truncated)" : "unknown (header not hex)";
  }

  const header = leU32(txHex);
  const version = header & 0x7fffffff;
  // Pre-Overwinter transactions have no version group id; the field only
  // exists once the overwintered bit (the header's top bit) is set.
  if (header >>> 31 !== 1) return `v${version} (pre-overwinter)`;

  const groupIdHex = txHex.slice(8, 16);
  if (!U32_HEX.test(groupIdHex)) {
    return groupIdHex.length < 8
      ? `v${version} (groupId truncated)`
      : `v${version} (groupId not hex)`;
  }

  return `v${version} groupId=0x${leU32(groupIdHex).toString(16).padStart(8, "0")}`;
}
