/**
 * Strict hex validation for `Buffer.from(_, "hex")` call sites, which silently truncate odd-length
 * or non-hex input.
 *
 * @param opts.allowEmpty treat the empty string as valid (default true); apdu-proxy rejects empty
 * APDUs.
 */
export function isValidHex(hex: string, opts?: { allowEmpty?: boolean }): boolean {
  if (hex.length === 0) return opts?.allowEmpty ?? true;
  return hex.length % 2 === 0 && /^[0-9a-fA-F]+$/.test(hex);
}
