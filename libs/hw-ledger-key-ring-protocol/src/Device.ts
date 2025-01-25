import { PublicKey } from "./PublicKey";
import {
  CommandBlock,
  CommandType,
  signCommandBlock,
  Derive,
  PublishKey,
  Seed,
} from "./CommandBlock";
import CommandStreamResolver from "./CommandStreamResolver";
import { crypto, DerivationPath, KeyPair } from "./Crypto";
import { StreamTree } from "./StreamTree";

/**
 *
 */
export interface Device {
  // Get the public key of the device
  getPublicKey(): Promise<PublicKey>;

  /**
   * Checks wether the public key can be directly fetched or if acquiring the public key
   * requires a user action.
   *
   * @returns True if the public key is directly available, false otherwise
   */
  isPublicKeyAvailable(): boolean;

  // The function receives the full stream but must only sign the last command block
  sign(stream: CommandBlock[], tree?: StreamTree): Promise<CommandBlock>;

  /**
   * Read the symmetric key from the stream tree at the given path. This function may not be implemented by all devices.
   * @param tree The stream tree
   * @param path The path to the key
   * @returns The public key of the symmetric key
   */
  readKey(tree: StreamTree, path: number[]): Promise<Uint8Array>;
}

interface SharedKey {
  xpriv: Uint8Array;
  publicKey: Uint8Array;
}

interface EncryptedSharedKey {
  encryptedXpriv: Uint8Array;
  publicKey: Uint8Array;
  ephemeralPublicKey: Uint8Array;
  initializationVector: Uint8Array;
}

export class SoftwareDevice implements Device {
  private keyPair: KeyPair;

  constructor(kp: KeyPair) {
    this.keyPair = kp;
  }

  async getPublicKey(): Promise<PublicKey> {
    return new PublicKey(this.keyPair.publicKey);
  }

  private generateSharedKey(): SharedKey {
    const xpriv = crypto.randomBytes(64);
    const pk = crypto.derivePrivate(xpriv, []);
    return { xpriv, publicKey: pk.publicKey };
  }

  private encryptSharedKey(sharedKey: SharedKey, recipient: Uint8Array): EncryptedSharedKey {
    const kp = crypto.randomKeypair();
    const ecdh = crypto.ecdh(kp, recipient);
    const initializationVector = crypto.randomBytes(16);
    const encryptedXpriv = crypto.encrypt(ecdh, initializationVector, sharedKey.xpriv);
    return {
      encryptedXpriv,
      publicKey: sharedKey.publicKey,
      ephemeralPublicKey: kp.publicKey,
      initializationVector,
    };
  }

  private decryptSharedKey(encryptedSharedKey: EncryptedSharedKey): SharedKey {
    const ecdh = crypto.ecdh(this.keyPair, encryptedSharedKey.ephemeralPublicKey);
    const xpriv = crypto.decrypt(
      ecdh,
      encryptedSharedKey.initializationVector,
      encryptedSharedKey.encryptedXpriv,
    );
    return { xpriv, publicKey: encryptedSharedKey.publicKey };
  }

  private async deriveKey(tree: StreamTree, path: number[]): Promise<SharedKey> {
    const event = await tree.getPublishKeyEvent(this.keyPair.publicKey, path);
    if (!event) {
      throw new Error("Cannot find key in the tree for the current device");
    }
    const encryptedSharedKey = {
      encryptedXpriv: event.encryptedXpriv,
      publicKey: event.groupPublicKey,
      ephemeralPublicKey: event.ephemeralPublicKey,
      initializationVector: event.nonce,
    };
    const sharedKey = this.decryptSharedKey(encryptedSharedKey);
    const newKey = crypto.derivePrivate(sharedKey.xpriv, path);
    const xpriv = new Uint8Array(64);
    xpriv.set(newKey.privateKey);
    xpriv.set(newKey.chainCode, 32);
    return { xpriv, publicKey: newKey.publicKey };
  }

  async sign(stream: CommandBlock[], tree?: StreamTree): Promise<CommandBlock> {
    if (stream.length === 0) {
      throw new Error("Cannot sign an empty stream");
    }
    if (stream[stream.length - 1].commands.length === 0) {
      throw new Error("Cannot sign an empty block");
    }
    const lastBlock = stream[stream.length - 1];

    lastBlock.issuer = this.keyPair.publicKey;

    // Resolve the stream (before the last block)
    const resolved = await CommandStreamResolver.resolve(stream.slice(0, stream.length - 1));

    // The shared key of the stream

    let sharedKey: SharedKey | null = null;

    // Iterate through the commands to inject encrypted keys
    for (let commandIndex = 0; commandIndex < lastBlock.commands.length; commandIndex++) {
      const command = lastBlock.commands[commandIndex];
      switch (command.getType()) {
        case CommandType.Seed: {
          // Generate the shared key
          sharedKey = this.generateSharedKey();

          // Encrypt the shared key and inject it in the command
          const encryptedSharedKey = this.encryptSharedKey(sharedKey, this.keyPair.publicKey);
          (command as Seed).groupKey = sharedKey.publicKey;
          (command as Seed).encryptedXpriv = encryptedSharedKey.encryptedXpriv;
          (command as Seed).ephemeralPublicKey = encryptedSharedKey.ephemeralPublicKey;
          (command as Seed).initializationVector = encryptedSharedKey.initializationVector;
          break;
        }
        case CommandType.Derive: {
          // Derive the shared key from the tree
          if (!tree) {
            throw new Error("Cannot derive a key without a tree");
          }
          sharedKey = await this.deriveKey(tree, (command as Derive).path);

          // Encrypt the shared key and inject it in the command
          const encryptedDerivedKey = this.encryptSharedKey(sharedKey, this.keyPair.publicKey);
          (command as Derive).groupKey = sharedKey.publicKey;
          (command as Derive).encryptedXpriv = encryptedDerivedKey.encryptedXpriv;
          (command as Derive).initializationVector = encryptedDerivedKey.initializationVector;
          (command as Derive).ephemeralPublicKey = encryptedDerivedKey.ephemeralPublicKey;
          break;
        }
        case CommandType.PublishKey: {
          // Derive the shared key from the tree
          if (!sharedKey) {
            // If the current stream is the seed stream, read the key from the first command in the first block
            const encryptedKey = resolved.getEncryptedKey(this.keyPair.publicKey);
            if (encryptedKey) {
              sharedKey = this.decryptSharedKey({
                encryptedXpriv: encryptedKey.encryptedXpriv,
                initializationVector: encryptedKey.initialiationVector,
                publicKey: encryptedKey.issuer,
                ephemeralPublicKey: encryptedKey.ephemeralPublicKey,
              });
            } else if (stream[0].commands[0].getType() == CommandType.Seed) {
              if (crypto.to_hex(stream[0].issuer) !== crypto.to_hex(this.keyPair.publicKey)) {
                throw new Error("Cannot read the seed key from another device");
              }
            } else {
              // console.dir(stream, { depth: null });
              sharedKey = await this.deriveKey(tree!, resolved.getStreamDerivationPath());
            }
            if (!sharedKey) throw new Error("Cannot find the shared key");
          }
          const encryptedSharedKey = this.encryptSharedKey(
            sharedKey!,
            (command as PublishKey).recipient,
          );
          (command as PublishKey).encryptedXpriv = encryptedSharedKey.encryptedXpriv;
          (command as PublishKey).initializationVector = encryptedSharedKey.initializationVector;
          (command as PublishKey).ephemeralPublicKey = encryptedSharedKey.ephemeralPublicKey;
          break;
        }
      }
    }
    const signature = signCommandBlock(
      lastBlock,
      (await this.getPublicKey()).publicKey,
      this.keyPair.privateKey,
    ).signature;
    lastBlock.signature = signature;
    return lastBlock;
  }

  async readKey(tree: StreamTree, path: number[]): Promise<Uint8Array> {
    const event = await tree.getPublishKeyEvent(this.keyPair.publicKey, path);
    if (!event) {
      throw new Error("Cannot find key in the tree for the current device");
    }
    const encryptedSharedKey: EncryptedSharedKey = {
      encryptedXpriv: event.encryptedXpriv,
      initializationVector: event.nonce,
      publicKey: event.groupPublicKey,
      ephemeralPublicKey: event.ephemeralPublicKey,
    };
    const sharedKey = this.decryptSharedKey(encryptedSharedKey);

    // Derive the key to match the path
    let index = DerivationPath.toIndexArray(event.stream.getStreamPath()!).length;
    while (index < path.length) {
      const derivation = crypto.derivePrivate(sharedKey.xpriv, [index]);
      const xpriv = new Uint8Array(64);
      xpriv.set(derivation.privateKey);
      xpriv.set(derivation.chainCode, 32);
      sharedKey.xpriv = xpriv;
      sharedKey.publicKey = derivation.publicKey;
      index += 1;
    }

    return sharedKey.xpriv;
  }

  isPublicKeyAvailable(): boolean {
    return true;
  }
}

/**
 *
 */
export function createDevice(): Device {
  const kp = crypto.randomKeypair();
  return new SoftwareDevice(kp);
}

export const ISSUER_PLACEHOLDER = new Uint8Array([
  3, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0,
]);
