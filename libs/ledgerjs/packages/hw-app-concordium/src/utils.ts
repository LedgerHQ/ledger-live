import { Buffer } from "buffer";
import BIPPath from "bip32-path";
import { SchemeId } from "./types";

/**
 * Serializes a map (object) into a Buffer.
 * @private
 * @param map The map to serialize
 * @param encodeSize Function to encode the size (number of keys)
 * @param encodeKey Function to encode each key
 * @param encodeValue Function to encode each value
 * @returns Serialized buffer
 */
export function serializeMap<T>(
  map: Record<string, T>,
  encodeSize: (size: number) => Buffer,
  encodeKey: (key: string) => Buffer,
  encodeValue: (value: T) => Buffer,
): Buffer {
  const keys = Object.keys(map);
  const buffers = [encodeSize(keys.length)];
  keys.forEach(key => {
    buffers.push(encodeKey(key));
    buffers.push(encodeValue(map[key]));
  });
  return Buffer.concat(buffers);
}

/**
 * Encodes a 8 bit unsigned integer to a Buffer using big endian.
 * @private
 * @param value a 8 bit integer
 * @returns big endian serialization of the input
 */
export function encodeWord8(value: number): Buffer {
  if (value > 255 || value < 0 || !Number.isInteger(value)) {
    throw new Error("The input has to be a 8 bit unsigned integer but it was: " + value);
  }
  return Buffer.of(value);
}

/**
 * Encodes a 16 bit unsigned integer to a Buffer using big endian.
 * @private
 * @param value a 16 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord16(value: number, useLittleEndian = false): Buffer {
  if (value > 65535 || value < 0 || !Number.isInteger(value)) {
    throw new Error("The input has to be a 16 bit unsigned integer but it was: " + value);
  }
  const arr = new ArrayBuffer(2);
  const view = new DataView(arr);
  view.setUint16(0, value, useLittleEndian);
  return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 32 bit unsigned integer to a Buffer.
 * @private
 * @param value a 32 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord32(value: number, useLittleEndian = false): Buffer {
  if (value > 4294967295 || value < 0 || !Number.isInteger(value)) {
    throw new Error("The input has to be a 32 bit unsigned integer but it was: " + value);
  }
  const arr = new ArrayBuffer(4);
  const view = new DataView(arr);
  view.setUint32(0, value, useLittleEndian);
  return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a 64 bit unsigned integer to a Buffer using big endian.
 * @private
 * @param value a 64 bit integer
 * @param useLittleEndian a boolean value, if not given, the value is serialized in big endian.
 * @returns big endian serialization of the input
 */
export function encodeWord64(value: bigint, useLittleEndian = false): Buffer {
  if (value > 18446744073709551615n || value < 0n) {
    throw new Error("The input has to be a 64 bit unsigned integer but it was: " + value);
  }
  const arr = new ArrayBuffer(8);
  const view = new DataView(arr);
  view.setBigUint64(0, value, useLittleEndian);
  return Buffer.from(new Uint8Array(arr));
}

/**
 * Encodes a string as a Word8 value.
 * @private
 * @param value string representation of a number
 * @returns serialized Word8
 */
export function encodeWord8FromString(value: string): Buffer {
  return encodeWord8(Number(value));
}

/**
 * Serializes a public key. The serialization includes the scheme used for the key.
 * @private
 * @param key the key to serialize
 * @returns the serialization of the key
 */
export function serializeVerifyKey(key: { schemeId: string; verifyKey: string }): Buffer {
  let schemeId: number;
  if (key.schemeId === "Ed25519") {
    schemeId = SchemeId.Ed25519;
  } else {
    throw new Error(`Unknown key type: ${key.schemeId}`);
  }
  const keyBuffer = Buffer.from(key.verifyKey, "hex");
  const serializedScheme = encodeWord8(schemeId);
  return Buffer.concat([serializedScheme, keyBuffer]);
}

/**
 * Serializes a year and month string.
 * @private
 * @param yearMonth year and month formatted as "YYYYMM"
 * @returns the serialization of the year and month string
 */
export function serializeYearMonth(yearMonth: string): Buffer {
  if (yearMonth.length !== 6) {
    throw new Error(
      `Invalid yearMonth format: expected 6 characters (YYYYMM), got ${yearMonth.length}`,
    );
  }

  if (!/^\d{6}$/.test(yearMonth)) {
    throw new Error(`Invalid yearMonth format: "${yearMonth}" could not be parsed`);
  }

  const year = parseInt(yearMonth.substring(0, 4), 10);
  const month = parseInt(yearMonth.substring(4, 6), 10);

  if (month < 1 || month > 12) {
    throw new Error(`Invalid month: ${month} (must be between 1 and 12)`);
  }

  const serializedYear = encodeWord16(year);
  const serializedMonth = encodeWord8(month);
  return Buffer.concat([serializedYear, serializedMonth]);
}

/**
 * Serializes a BIP32 path array into device-compatible format.
 * Format: [1 byte: path length] [4 bytes per element: path components]
 * @private
 * @param path - BIP32 path as number array
 * @returns Serialized path buffer
 */
export function serializePath(path: number[]): Buffer {
  const buf = Buffer.alloc(1 + path.length * 4);
  buf.writeUInt8(path.length, 0);
  for (const [i, num] of path.entries()) {
    buf.writeUInt32BE(num, 1 + i * 4);
  }
  return buf;
}

/**
 * Converts a BIP32 path string to serialized Buffer format.
 *
 * @param originalPath - BIP32 path string (e.g., "44'/919'/0'/0/0")
 * @returns Serialized path buffer ready for device transmission
 */
export function pathToBuffer(originalPath: string): Buffer {
  const pathNums: number[] = BIPPath.fromString(originalPath).toPathArray();
  return serializePath(pathNums);
}

/**
 * Chunks a buffer into smaller pieces of a maximum size.
 *
 * @param buffer - The buffer to chunk
 * @param maxSize - Maximum size of each chunk
 * @returns Array of buffer chunks
 */
export function chunkBuffer(buffer: Buffer, maxSize: number): Buffer[] {
  if (maxSize <= 0) {
    throw new Error(`maxSize must be positive, got ${maxSize}`);
  }
  const chunks: Buffer[] = [];
  let offset = 0;
  while (offset < buffer.length) {
    const chunkSize = Math.min(maxSize, buffer.length - offset);
    chunks.push(Buffer.from(buffer.subarray(offset, offset + chunkSize)));
    offset += chunkSize;
  }
  return chunks;
}

/**
 * Decodes a 16 bit unsigned integer from a Buffer using big endian.
 * @private
 * @param buffer a buffer containing at least 2 bytes
 * @param offset the offset at which to read (default 0)
 * @returns the decoded 16 bit unsigned integer
 */
export function decodeWord16(buffer: Buffer, offset = 0): number {
  if (buffer.length < offset + 2) {
    throw new Error(
      `Buffer too short: expected at least ${offset + 2} bytes, got ${buffer.length}`,
    );
  }
  return buffer.readUInt16BE(offset);
}

/**
 * Decodes a 32 bit unsigned integer from a Buffer using big endian.
 * @private
 * @param buffer a buffer containing at least 4 bytes
 * @param offset the offset at which to read (default 0)
 * @returns the decoded 32 bit unsigned integer
 */
export function decodeWord32(buffer: Buffer, offset = 0): number {
  if (buffer.length < offset + 4) {
    throw new Error(
      `Buffer too short: expected at least ${offset + 4} bytes, got ${buffer.length}`,
    );
  }
  return buffer.readUInt32BE(offset);
}

/**
 * Decodes a 64 bit unsigned integer from a Buffer using big endian.
 * @private
 * @param buffer a buffer containing at least 8 bytes
 * @param offset the offset at which to read (default 0)
 * @returns the decoded 64 bit unsigned integer as bigint
 */
export function decodeWord64(buffer: Buffer, offset = 0): bigint {
  if (buffer.length < offset + 8) {
    throw new Error(
      `Buffer too short: expected at least ${offset + 8} bytes, got ${buffer.length}`,
    );
  }
  return buffer.readBigUInt64BE(offset);
}
