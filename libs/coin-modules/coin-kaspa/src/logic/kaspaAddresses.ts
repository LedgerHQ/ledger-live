import base32 from "./base32";

export enum ScriptTypeVersion {
  SCHNORR = 0,
  ECDSA = 1,
  P2SH = 8,
}

type ParsedExtendedPublicKey = {
  chainCode: Buffer;
  compressedPublicKey: Buffer;
  uncompressedPublicKey: Buffer;
};

export function addressToPublicKey(address: string): { version: number; publicKey: number[] } {
  const addrPart = address.split(":")[1];
  const payload = convertBits(base32.decode(addrPart), 5, 8);

  switch (payload[0]) {
    // for 0 and 8
    case 0:
    case 8:
      return { version: payload[0], publicKey: payload.slice(1, 33) };
    case 1:
      // for ECDSA it's one byte more
      return { version: payload[0], publicKey: payload.slice(1, 34) };
    default:
      throw new Error("Unable to translate address to ScriptPublicKey");
  }
}

export function publicKeyToAddress(
  hashBuffer: Buffer,
  stripPrefix: boolean = false,
  scriptTypeVersion: ScriptTypeVersion = ScriptTypeVersion.SCHNORR,
): string {
  const eight0: number[] = [0, 0, 0, 0, 0, 0, 0, 0];
  const prefixData: number[] = prefixToArray("kaspa").concat([0]);
  const versionByte: number = scriptTypeVersion;

  const arr: number[] = Array.from(hashBuffer);
  const payloadData: number[] = convertBits([versionByte, ...arr], 8, 5);
  const checksumData: number[] = [...prefixData, ...payloadData, ...eight0];
  const payload: number[] = [...payloadData, ...checksumToArray(polymod(checksumData))];

  if (stripPrefix) {
    return base32.encode(payload);
  } else {
    return `kaspa:${base32.encode(payload)}`;
  }
}

export function addressToScriptPublicKey(address: string): string {
  const { version, publicKey } = addressToPublicKey(address);

  switch (version) {
    case 0:
      return "20" + numArrayToHexString(publicKey) + "ac";
    case 1:
      return "21" + numArrayToHexString(publicKey) + "ab";
    case 8:
      return "aa20" + numArrayToHexString(publicKey) + "87";
    default:
      throw new Error("Address could not be translated to script public key");
  }
}

/**
 * Converts a script public key to a corresponding address.
 *
 * @param {string} scriptPublicKey - The script public key to be converted.
 * @param {boolean} [stripPrefix=false] - Optional flag to determine if the prefix should be stripped from the resulting address.
 * @return {string} The address derived from the provided script public key.
 */
export function scriptPublicKeyToAddress(scriptPublicKey: string, stripPrefix?: boolean): string {
  // determine version of script public key
  const version = determineVersionFromScriptPublicKey(scriptPublicKey);
  const publicKey = Buffer.from(
    scriptPublicKey.slice(version === ScriptTypeVersion.P2SH ? 4 : 2, -2),
    "hex",
  ); // Remove the prefix and suffix
  return publicKeyToAddress(publicKey, stripPrefix, version);
}

export function isValidKaspaAddress(address: string): boolean {
  // Kaspa addresses typically start with 'kaspa:' and are followed by a hexadecimal string
  const kaspaAddressRegex = new RegExp(`^kaspa:([${base32.CHARSET}]{61}|[${base32.CHARSET}]{63})$`);

  // Check if the address matches the Kaspa format
  if (!kaspaAddressRegex.test(address)) {
    return false;
  }

  // do a round-trip to publickey and back - checks the checksum and all the functionality
  try {
    const extractedPublicKey = addressToPublicKey(address);
    const roundtripAddress: string = publicKeyToAddress(
      Buffer.from(extractedPublicKey.publicKey),
      false,
      extractedPublicKey.version,
    );

    if (address !== roundtripAddress) {
      // checksum not valid
      return false;
    }
  } catch {
    // Unable to translate address to ScriptPublicKey
    return false;
  }

  return true;
}

export function parseExtendedPublicKey(extendedPublicKey: Buffer): ParsedExtendedPublicKey {
  /**
   * Converts a full public key to an xPublicKey.
   *
   * @param {Buffer} fullPublicKey - The complete public key buffer which includes the chain code.
   * @returns {Buffer} The xPublicKey obtained by processing the full public key.
   *
   * The xPublicKey consists of a single byte y-coordinate parity followed by the first 32 bytes of the x coordinate.
   */
  // Validate the length of the extended public key
  if (extendedPublicKey.length !== 99) {
    throw new Error("Invalid extended public key length. Expected length is 99 bytes.");
  }
  // Index 0 is always 0x41 = (65) the length of the following full public key
  // Index 66 is always 0x20 = (32) the length of the following chain code
  const chainCode = Buffer.from(extendedPublicKey.subarray(67, 67 + 32));
  // x-coord is index [2, 34),
  // y-coord is index [34, 66)
  const yCoordParity = extendedPublicKey[65] % 2;

  return {
    chainCode,
    compressedPublicKey: Buffer.from([yCoordParity + 2, ...extendedPublicKey.subarray(2, 34)]),
    uncompressedPublicKey: Buffer.from(extendedPublicKey.subarray(1, 1 + 65)),
  };
}

function convertBits(data: number[], from: number, to: number, strict: boolean = false): number[] {
  const result: number[] = [];
  let accumulator = 0;
  let bits = 0;
  const mask = (1 << to) - 1;

  for (let i = 0; i < data.length; i++) {
    const value = data[i];
    if (value < 0 || value >> from !== 0) {
      throw new Error(`Invalid argument: value = ${value}`);
    }

    accumulator = (accumulator << from) | value;
    bits += from;
    while (bits >= to) {
      bits -= to;
      result.push((accumulator >> bits) & mask);
    }
  }

  if (!strict) {
    if (bits > 0) {
      result.push((accumulator << (to - bits)) & mask);
    }
  } else {
    if (bits > 0 && ((accumulator << (to - bits)) & mask) !== 0) {
      throw new Error("Conversion requires padding but strict mode was used");
    }
  }

  return result;
}

function prefixToArray(prefix: string): number[] {
  const result: number[] = [];
  for (let i = 0; i < prefix.length; i++) {
    result.push(prefix.charCodeAt(i) & 31);
  }
  return result;
}

function polymod(data: number[]): number {
  const GENERATOR1: number[] = [0x98, 0x79, 0xf3, 0xae, 0x1e];
  const GENERATOR2: number[] = [0xf2bc8e61, 0xb76d99e2, 0x3e5fb3c4, 0x2eabe2a8, 0x4f43e470];

  // Split c into two parts: 8 bits (c0) + 32 bits (c1)
  let c0 = 0;
  let c1 = 1;
  let C: number = 0;

  for (let j = 0; j < data.length; j++) {
    // Set C to c shifted by 35 bits
    C = c0 >>> 3;

    // Mask the remaining bits of c0 (8 bits)
    c0 &= 0x07;

    // Shift c0 as a whole number
    c0 <<= 5;
    c0 |= c1 >>> 27;

    // Mask the remaining bits of c1 (27 bits)
    c1 &= 0x07ffffff;

    // Shift c1 and add current data value
    c1 <<= 5;
    c1 ^= data[j];

    // Perform XOR operations with GENERATOR arrays
    for (let i = 0; i < GENERATOR1.length; ++i) {
      if (C & (1 << i)) {
        c0 ^= GENERATOR1[i];
        c1 ^= GENERATOR2[i];
      }
    }
  }

  // Final XOR operation on c1
  c1 ^= 1;

  // Handle negative numbers to ensure it becomes a large positive number
  if (c1 < 0) {
    c1 ^= 1 << 31;
    c1 += (1 << 30) * 2;
  }

  // Return the final result
  return c0 * (1 << 30) * 4 + c1;
}

function checksumToArray(checksum: number): number[] {
  const result: number[] = [];
  for (let i = 0; i < 8; ++i) {
    result.push(checksum & 31); // Extract the last 5 bits
    checksum = Math.floor(checksum / 32); // Ensure integer division
  }
  return result.reverse();
}

// Function to determine the version based on the scriptPublicKey string
function determineVersionFromScriptPublicKey(scriptPublicKey: string): ScriptTypeVersion {
  if (
    scriptPublicKey.startsWith("20") &&
    scriptPublicKey.endsWith("ac") &&
    scriptPublicKey.length === 68
  ) {
    return ScriptTypeVersion.SCHNORR;
  } else if (
    scriptPublicKey.startsWith("21") &&
    scriptPublicKey.endsWith("ab") &&
    scriptPublicKey.length === 70
  ) {
    return ScriptTypeVersion.ECDSA;
  } else if (
    scriptPublicKey.startsWith("aa20") &&
    scriptPublicKey.endsWith("87") &&
    scriptPublicKey.length === 70
  ) {
    return ScriptTypeVersion.P2SH;
  }

  throw new Error("Script public key version could not be determined.");
}

function numArrayToHexString(numArray: number[] = []): string {
  const hexArr = [];

  for (const num of numArray) {
    hexArr.push(("00" + num.toString(16)).slice(-2));
  }

  return hexArr.join("");
}
