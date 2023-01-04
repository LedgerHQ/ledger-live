import { DerEncodedPublicKey, PublicKey } from "@dfinity/agent";

function equals(b1: ArrayBuffer, b2: ArrayBuffer): boolean {
  if (b1.byteLength !== b2.byteLength) {
    return false;
  }

  const u1 = new Uint8Array(b1);
  const u2 = new Uint8Array(b2);
  for (let i = 0; i < u1.length; i++) {
    if (u1[i] !== u2[i]) {
      return false;
    }
  }
  return true;
}

const buf2hex = (buffer: ArrayBuffer): string => {
  return [...new Uint8Array(buffer)]
    .map((x) => x.toString(16).padStart(2, "0"))
    .join("");
};

// This implementation is adjusted from the Ed25519PublicKey.
// The RAW_KEY_LENGTH and DER_PREFIX are modified accordingly
export class Secp256k1PublicKey implements PublicKey {
  public static fromRaw(rawKey: ArrayBuffer): Secp256k1PublicKey {
    return new Secp256k1PublicKey(rawKey);
  }

  public static fromDer(derKey: DerEncodedPublicKey): Secp256k1PublicKey {
    return new Secp256k1PublicKey(this.derDecode(derKey));
  }

  // The length of secp256k1 public keys is always 65 bytes.
  private static RAW_KEY_LENGTH = 65;

  // Adding this prefix to a raw public key is sufficient to DER-encode it.
  // prettier-ignore
  private static DER_PREFIX = Uint8Array.from([
    0x30, 0x56, // SEQUENCE
    0x30, 0x10, // SEQUENCE
    0x06, 0x07, 0x2a, 0x86, 0x48, 0xce, 0x3d, 0x02, 0x01, // OID ECDSA
    0x06, 0x05, 0x2b, 0x81, 0x04, 0x00, 0x0a, // OID secp256k1
    0x03, 0x42, // BIT STRING
    0x00, // no padding
  ]);

  private static derEncode(publicKey: ArrayBuffer): DerEncodedPublicKey {
    if (publicKey.byteLength !== Secp256k1PublicKey.RAW_KEY_LENGTH) {
      const bl = publicKey.byteLength;
      throw new TypeError(
        `secp256k1 public key must be ${Secp256k1PublicKey.RAW_KEY_LENGTH} bytes long (is ${bl})`
      );
    }

    const derPublicKey = Uint8Array.from([
      ...Secp256k1PublicKey.DER_PREFIX,
      ...new Uint8Array(publicKey),
    ]);

    return derPublicKey.buffer as DerEncodedPublicKey;
  }

  private static derDecode(key: DerEncodedPublicKey): ArrayBuffer {
    const expectedLength =
      Secp256k1PublicKey.DER_PREFIX.length + Secp256k1PublicKey.RAW_KEY_LENGTH;
    if (key.byteLength !== expectedLength) {
      const bl = key.byteLength;
      throw new TypeError(
        `secp256k1 DER-encoded public key must be ${expectedLength} bytes long (is ${bl})`
      );
    }

    const rawKey = key.slice(0, Secp256k1PublicKey.DER_PREFIX.length);
    if (!equals(this.derEncode(rawKey), key)) {
      throw new TypeError(
        "secp256k1 DER-encoded public key is invalid. A valid secp256k1 DER-encoded public key " +
          `must have the following prefix: ${Secp256k1PublicKey.DER_PREFIX}`
      );
    }

    return rawKey;
  }

  private readonly rawKey: ArrayBuffer;
  private readonly derKey: DerEncodedPublicKey;

  // `fromRaw` and `fromDer` should be used for instantiation, not this constructor.
  private constructor(key: ArrayBuffer) {
    this.rawKey = key;
    this.derKey = Secp256k1PublicKey.derEncode(key);
  }

  public toDer(): DerEncodedPublicKey {
    return this.derKey;
  }

  public toRaw(): ArrayBuffer {
    return this.rawKey;
  }

  public toHex(): string {
    const hexPubKey = buf2hex(this.toRaw());

    const isHex = hexPubKey.match("^[0-9a-fA-F]+$");
    if (!isHex) {
      throw new Error(`${hexPubKey} is not a hex string.`);
    }
  
    if (hexPubKey.length < 130 || hexPubKey.length > 150) {
      throw new Error(`The key must be >= 130 characters and <= 150 characters.`);
    }

    return hexPubKey;
  }
}
