import { Account, Address } from "@ledgerhq/types-live";
import crc from "crc";

export const getAddress = (a: Account): Address =>
  a.freshAddresses.length > 0
    ? a.freshAddresses[0]
    : { address: a.freshAddress, derivationPath: a.freshAddressPath };

export function validateAddress(address: string): { isValid: boolean } {
  try {
    address_from_hex(address);
    return { isValid: true };
  } catch (e) {
    return { isValid: false };
  }
}

function bufferFromArrayBufferView(buf: ArrayBufferView) {
  return Buffer.from(buf.buffer, buf.byteOffset, buf.byteLength);
}

function blobFromHex(hex: string) {
  return Buffer.from(hex, "hex");
}

function crc32_del(buf: Buffer) {
  const res = buf.subarray(4);
  if (crc.crc32(res) !== buf.readUInt32BE(0)) {
    throw Error("Not a valid ICP address");
  }
  return res;
}

function blobToHex(blob: Buffer) {
  return blob.toString("hex");
}

function crc32_add(buf: Buffer) {
  const res = Buffer.allocUnsafe(4 + buf.length);
  res.writeUInt32BE(crc.crc32(buf));
  buf.copy(res, 4);
  return res;
}

function address_to_hex(addr_buf: Buffer) {
  return blobToHex(crc32_add(addr_buf));
}

function address_from_hex(hex_str: string) {
  if (hex_str.length !== 64) {
    throw Error("invalid input hex length");
  }

  const buf = bufferFromArrayBufferView(blobFromHex(hex_str));
  if (buf.byteLength !== 32) {
    throw Error("invalid address length in bytes");
  }

  const ret = crc32_del(buf);
  const hex_str2 = address_to_hex(ret);
  if (hex_str.toLowerCase() !== hex_str2.toLowerCase()) {
    throw Error("dencode/encode roundtrip changes the address");
  }

  return ret;
}
