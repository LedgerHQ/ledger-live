import { Device, crypto } from ".";
import { StreamTree } from "./StreamTree";

/**
 *
 */
export enum StreamTreeCipherMode {
  AES_256_CBC = 0x00,
  AES_256_GCM = 0x01,
}

const TAG_LENGTH = 16;

interface DecodedPayload {
  version: number;
  ephemeralPublicKey: Uint8Array;
  nonce: Uint8Array;
  encrypted: Uint8Array;
  checksum: Uint8Array;
}

/**
 *
 */
export class StreamTreeCipher {
  private _mode: StreamTreeCipherMode;
  private _device: Device;

  constructor(mode: StreamTreeCipherMode, device: Device) {
    this._mode = mode;
    this._device = device;
  }

  get mode(): StreamTreeCipherMode {
    return this._mode;
  }

  /**
   * Encrypts a message for a given path in the tree
   * @param tree
   * @param path
   * @param message
   * @param nonce optional nonce to use for the encryption (if null a random nonce will be generated)
   * @returns the encrypted message with the nonce prepended (1 byte for the nonce length + nonce + 33 bytes ephemeral key + encrypted message + 4 bytes checksum)
   * @throws Error if the cipher mode is not implemented
   * @throws Error if the path is not found in the tree and can't be derived from the device
   */
  async encrypt(
    tree: StreamTree,
    path: number[],
    message: Uint8Array,
    nonce: Uint8Array | null = null,
  ): Promise<Uint8Array> {
    if (nonce === null) {
      nonce = crypto.randomBytes(16);
    }

    // Generate ephemeral key pair
    const ephemeralKeyPair = crypto.randomKeypair();

    // Get the group public key
    const groupKeypair = await this.getGroupKeypair(tree, path);

    // Compute the secret via ECDH
    const secret = crypto.ecdh(ephemeralKeyPair, groupKeypair.publicKey);

    let encrypted: Uint8Array = new Uint8Array(0);
    switch (this._mode) {
      case StreamTreeCipherMode.AES_256_CBC: {
        encrypted = crypto.encrypt(secret, nonce, message);
        break;
      }
      case StreamTreeCipherMode.AES_256_GCM: {
        encrypted = crypto.encrypt(secret, nonce, message);
        break;
      }
      default:
        throw new Error("Unknown cipher mode");
    }

    // Serialize encrypted data
    return this.encodeData(ephemeralKeyPair.publicKey, nonce, encrypted, message);
  }

  private async getGroupKeypair(
    tree: StreamTree,
    path: number[],
  ): Promise<{ privateKey: Uint8Array; publicKey: Uint8Array }> {
    if (!this._device.isPublicKeyAvailable()) {
      throw new Error("Stream tree cipher is only available for software devices");
    }
    const member = await this._device.getPublicKey();
    const event = await tree.getPublishKeyEvent(member.publicKey, path);
    if (!event) {
      throw new Error("Cannot find key in the tree for the current device");
    }

    // Compute the relative path from the event to the path parameter
    const privateKey = (await this._device.readKey(tree, path)).slice(0, 32);
    const publicKey = crypto.keypairFromSecretKey(privateKey).publicKey;
    return { privateKey, publicKey };
  }

  private encodeData(
    ephemeralPublicKey: Uint8Array,
    nonce: Uint8Array,
    data: Uint8Array,
    message: Uint8Array,
  ) {
    const result = new Uint8Array(1 + 33 + nonce.length + TAG_LENGTH + data.length);
    let offset = 0;
    // Version
    result[offset] = this._mode;
    offset += 1;
    // Ephemeral public key
    result.set(ephemeralPublicKey, offset);
    offset += ephemeralPublicKey.length;
    // Nonce/IV
    result.set(nonce, offset);
    offset += nonce.length;
    // Checksum
    if (this._mode == StreamTreeCipherMode.AES_256_CBC) {
      const checksum = this.computeChecksum(message);
      result.set(checksum, offset);
      offset += checksum.length;
    }
    // Encrypted data
    result.set(data, offset);
    return result;
  }

  private decodeData(payload: Uint8Array): DecodedPayload {
    const version = payload[0];
    let offset = 1;
    const ephemeralPublicKey = payload.slice(offset, offset + 33);
    offset += 33;
    const nonce = payload.slice(offset, offset + 16);
    offset += 16;
    const checksum = payload.slice(payload.length - 16, payload.length);
    const encrypted = payload.slice(offset, payload.length - 16);
    return {
      version,
      ephemeralPublicKey,
      nonce,
      encrypted,
      checksum,
    };
  }

  /**
   * Decrypts a message for a given path in the tree
   * @param tree
   * @param path
   * @param encrytedPayload
   * @returns the decrypted message
   * @throws Error if the cipher mode is not implemented
   * @throws Error if the path is not found in the tree and can't be derived from the device
   * @throws Error if the checksum is invalid
   */
  async decrypt(
    tree: StreamTree,
    path: number[],
    encrytedPayload: Uint8Array,
  ): Promise<Uint8Array> {
    const decodedPayload = this.decodeData(encrytedPayload);

    const ephemeralKey = decodedPayload.ephemeralPublicKey;
    const nonce = decodedPayload.nonce;
    const encryptedMessage = decodedPayload.encrypted;
    const checksum = decodedPayload.checksum;

    const sharedKeyPair = await this.getGroupKeypair(tree, path);
    const secret = crypto.ecdh(sharedKeyPair, ephemeralKey);

    let decrypted = new Uint8Array(0);
    switch (this._mode) {
      case StreamTreeCipherMode.AES_256_CBC: {
        decrypted = crypto.decrypt(secret, nonce, encryptedMessage);
        const computedChecksum = this.computeChecksum(decrypted);
        if (crypto.to_hex(computedChecksum) !== crypto.to_hex(checksum)) {
          throw new Error("Invalid checksum");
        }
        break;
      }
      case StreamTreeCipherMode.AES_256_GCM: {
        decrypted = crypto.decrypt(secret, nonce, encryptedMessage);
        break;
      }
      default:
        throw new Error("Unknown cipher mode");
    }

    return decrypted;
  }

  private computeChecksum(message: Uint8Array): Uint8Array {
    const hash = crypto.hash(message);
    return hash.slice(0, 16);
  }

  static create(
    device: Device,
    mode: StreamTreeCipherMode = StreamTreeCipherMode.AES_256_GCM,
  ): StreamTreeCipher {
    return new StreamTreeCipher(mode, device);
  }
}
