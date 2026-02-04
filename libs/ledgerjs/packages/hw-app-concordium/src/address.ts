import bs58check from "bs58check";

/**
 * Concordium account address with Base58 ↔ Buffer conversion.
 *
 * Handles Concordium-specific Base58Check encoding:
 * - Version byte: 1 (prepended before Base58 encoding)
 * - Raw address: 32 bytes
 * - Base58 encoded: exactly 50 characters
 *
 * This class provides a type-safe wrapper for Concordium addresses,
 * ensuring correct encoding/decoding and validation.
 */
export class AccountAddress {
  /** Base58-encoded address string (50 characters) */
  public readonly address: string;

  /**
   * Private constructor - use fromBase58() or fromBuffer() to create instances.
   * @param buffer - Raw 32-byte address
   */
  private constructor(private readonly buffer: Buffer) {
    if (buffer.length !== 32) {
      throw new Error("Address must be 32 bytes");
    }
    this.address = this.toBase58();
  }

  /**
   * Parse a Base58-encoded Concordium address.
   *
   * @param address - Base58 address string (must be exactly 50 characters)
   * @returns AccountAddress instance
   * @throws Error if address is not 50 characters or has invalid version byte
   *
   * @example
   * const addr = AccountAddress.fromBase58("3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G");
   */
  static fromBase58(address: string): AccountAddress {
    if (address.length !== 50) {
      throw new Error("Address must be 50 characters");
    }

    const decoded = bs58check.decode(address);

    if (decoded[0] !== 1) {
      throw new Error("Invalid address version");
    }

    const addressBytes = Buffer.from(decoded.subarray(1));

    return new AccountAddress(addressBytes);
  }

  /**
   * Create an AccountAddress from raw 32-byte buffer.
   *
   * @param buffer - Raw address bytes (must be exactly 32 bytes)
   * @returns AccountAddress instance
   * @throws Error if buffer is not 32 bytes
   *
   * @example
   * const addr = AccountAddress.fromBuffer(Buffer.from("...", "hex"));
   */
  static fromBuffer(buffer: Buffer): AccountAddress {
    if (buffer.length !== 32) {
      throw new Error("Address buffer must be 32 bytes");
    }
    return new AccountAddress(buffer);
  }

  /**
   * Convert address to Base58-encoded string.
   *
   * @returns Base58-encoded address (50 characters)
   *
   * @example
   * const base58 = addr.toBase58();
   * // "3kBx2h5Y2veb4hZgAJWPrr8RyQESKm5TjzF3ti1QQ4VSYLwK1G"
   */
  toBase58(): string {
    const withVersion = Buffer.concat([Buffer.from([1]), this.buffer]);
    return bs58check.encode(withVersion);
  }

  /**
   * Get raw 32-byte address buffer.
   *
   * @returns Raw address bytes (32 bytes)
   *
   * @example
   * const raw = addr.toBuffer();
   * // Buffer of 32 bytes
   */
  toBuffer(): Buffer {
    return Buffer.from(this.buffer);
  }
}
