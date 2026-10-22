import type { Principal } from "@icp-sdk/core/principal";
import { sha224 } from "@noble/hashes/sha2";

const SUBACCOUNT_LENGTH = 32;
const ACCOUNT_ID_DOMAIN = new TextEncoder().encode("\x0Aaccount-id");

// CRC-32 (IEEE 802.3), the checksum the ICP ledger prefixes to an account identifier.
const crc32 = (bytes: Uint8Array): number => {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
    }
  }
  return (crc ^ 0xffffffff) >>> 0;
};

export class SubAccount {
  private constructor(private readonly bytes: Uint8Array) {}

  static fromBytes(bytes: Uint8Array): SubAccount | Error {
    if (bytes.length !== SUBACCOUNT_LENGTH) {
      return new Error("Subaccount length must be 32-bytes");
    }
    return new SubAccount(bytes);
  }

  static default(): SubAccount {
    return new SubAccount(new Uint8Array(SUBACCOUNT_LENGTH));
  }

  toUint8Array(): Uint8Array {
    return this.bytes;
  }
}

/**
 * ICP ledger account identifier: CRC-32(hash) ‖ hash, where
 * hash = SHA-224("\x0Aaccount-id" ‖ principal ‖ subaccount).
 */
export class AccountIdentifier {
  private constructor(private readonly bytes: Uint8Array) {}

  /** Lenient like Buffer's hex decoding: it stops at the first non-hex character and never throws. */
  static fromHex(hex: string): AccountIdentifier {
    return new AccountIdentifier(Uint8Array.from(Buffer.from(hex, "hex")));
  }

  static fromPrincipal({
    principal,
    subAccount = SubAccount.default(),
  }: {
    principal: Principal;
    subAccount?: SubAccount;
  }): AccountIdentifier {
    const hash = sha224(
      new Uint8Array([
        ...ACCOUNT_ID_DOMAIN,
        ...principal.toUint8Array(),
        ...subAccount.toUint8Array(),
      ]),
    );
    const checksum = new Uint8Array(4);
    new DataView(checksum.buffer).setUint32(0, crc32(hash), false);
    return new AccountIdentifier(new Uint8Array([...checksum, ...hash]));
  }

  toHex(): string {
    return Buffer.from(this.bytes).toString("hex");
  }

  toUint8Array(): Uint8Array {
    return this.bytes;
  }
}
