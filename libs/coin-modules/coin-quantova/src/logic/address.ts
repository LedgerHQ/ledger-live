/**
 * Quantova address codec.
 *
 * Canonical user-facing address is **Q-branded Bech32m** over the 20-byte H160 body:
 *
 *   pubkey --SHA3-256--> digest[0..20]   (20-byte body; body[0] forced to 0x40 = "Q")
 *   display = bech32m(hrp="q", body)  ->  rendered uppercase as "Q1…"
 *
 * The hex H160 form ("Q<40-hex>" / "Qx<40-hex>" / "0x<40-hex>") is also accepted on the
 * wire (see runtime `token.rs::q_address_to_account`). Both encode the same 20 bytes.
 *
 * This is a self-contained bech32m implementation (BIP-350 polynomial, const 0x2bc830a3)
 * so the module has no extra runtime dependency.
 */
import { QADDR_HRP, QADDR_BRAND_BYTE } from "../constants";

const CHARSET = "qpzry9x8gf2tvdw0s3jn54khce6mua7l";
const BECH32M_CONST = 0x2bc830a3;

function polymod(values: number[]): number {
  const GEN = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
  let chk = 1;
  for (const v of values) {
    const top = chk >> 25;
    chk = ((chk & 0x1ffffff) << 5) ^ v;
    for (let i = 0; i < 5; i++) if ((top >> i) & 1) chk ^= GEN[i];
  }
  return chk;
}

function hrpExpand(hrp: string): number[] {
  const out: number[] = [];
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) >> 5);
  out.push(0);
  for (let i = 0; i < hrp.length; i++) out.push(hrp.charCodeAt(i) & 31);
  return out;
}

function convertBits(data: number[], from: number, to: number, pad: boolean): number[] | null {
  let acc = 0;
  let bits = 0;
  const out: number[] = [];
  const maxv = (1 << to) - 1;
  for (const value of data) {
    if (value < 0 || value >> from !== 0) return null;
    acc = (acc << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      out.push((acc >> bits) & maxv);
    }
  }
  if (pad) {
    if (bits > 0) out.push((acc << (to - bits)) & maxv);
  } else if (bits >= from || ((acc << (to - bits)) & maxv) !== 0) {
    return null;
  }
  return out;
}

/** Encode a 20-byte H160 body to the canonical "Q1…" bech32m address. */
export function encodeQAddress(body: Uint8Array): string {
  if (body.length !== 20) throw new Error("Quantova address body must be 20 bytes");
  const data = convertBits(Array.from(body), 8, 5, true);
  if (!data) throw new Error("Quantova address: 8->5 bit conversion failed");
  const values = hrpExpand(QADDR_HRP).concat(data);
  const mod = polymod(values.concat([0, 0, 0, 0, 0, 0])) ^ BECH32M_CONST;
  const checksum: number[] = [];
  for (let i = 0; i < 6; i++) checksum.push((mod >> (5 * (5 - i))) & 31);
  const payload = data.concat(checksum).map(d => CHARSET[d]).join("");
  // canonical display is uppercase ("Q1…")
  return `${QADDR_HRP}1${payload}`.toUpperCase();
}

/** Decode a "Q1…" bech32m address to its 20-byte H160 body, or null if invalid. */
export function decodeQAddress(addr: string): Uint8Array | null {
  const s = addr.toLowerCase();
  const pos = s.lastIndexOf("1");
  if (pos < 1 || pos + 7 > s.length) return null;
  const hrp = s.slice(0, pos);
  if (hrp !== QADDR_HRP) return null;
  const dataPart = s.slice(pos + 1);
  const decoded: number[] = [];
  for (const ch of dataPart) {
    const d = CHARSET.indexOf(ch);
    if (d === -1) return null;
    decoded.push(d);
  }
  if (polymod(hrpExpand(hrp).concat(decoded)) !== BECH32M_CONST) return null;
  const body = convertBits(decoded.slice(0, -6), 5, 8, false);
  if (!body || body.length !== 20) return null;
  if (body[0] !== QADDR_BRAND_BYTE) return null; // must carry the "Q" brand byte
  return Uint8Array.from(body);
}

/** Decode a hex H160 form ("Q<40hex>" / "Qx<40hex>" / "0x<40hex>") to its 20-byte body. */
export function decodeHexAddress(addr: string): Uint8Array | null {
  let hex = addr;
  if (/^(0x|0X|qx|Qx)/.test(hex)) hex = hex.slice(2);
  else if (/^[Qq]/.test(hex)) hex = hex.slice(1);
  if (!/^[0-9a-fA-F]{40}$/.test(hex)) return null;
  const body = new Uint8Array(20);
  for (let i = 0; i < 20; i++) body[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  if (body[0] !== QADDR_BRAND_BYTE) return null;
  return body;
}

/** True if `addr` is a valid Quantova address in either the Bech32m or hex H160 form. */
export function isValidQAddress(addr: string): boolean {
  if (typeof addr !== "string" || addr.length === 0) return false;
  return decodeQAddress(addr) !== null || decodeHexAddress(addr) !== null;
}
