import { splitTransaction } from "@ledgerhq/hw-app-btc/splitTransaction";
import { BitcoinAddress, BitcoinSigner, CreateTransaction } from "@ledgerhq/coin-bitcoin/signer";
import { generateMnemonic, mnemonicToSeed } from "bip39";
import { BIP32Factory } from "bip32";
import * as bitcoin from "bitcoinjs-lib";
import { secp256k1 } from "@noble/curves/secp256k1";
import { serializeTransaction } from "@ledgerhq/hw-app-btc/serializeTransaction";
import { BufferReader } from "@ledgerhq/psbtv2";

// ECC wrapper for @noble/curves/secp256k1 to be compatible with BIP32Factory
const eccWrapper = {
  isPoint(point: Uint8Array | Buffer): boolean {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      if (pointBytes.length !== 33 && pointBytes.length !== 65) return false;
      secp256k1.ProjectivePoint.fromHex(pointBytes);
      return true;
    } catch {
      return false;
    }
  },

  isPrivate(privateKey: Uint8Array | Buffer): boolean {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      if (keyBytes.length !== 32) return false;
      return secp256k1.utils.isValidPrivateKey(keyBytes);
    } catch {
      return false;
    }
  },

  pointFromScalar(privateKey: Uint8Array | Buffer, compressed = true): Uint8Array | null {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      if (!this.isPrivate(keyBytes)) return null;
      return secp256k1.getPublicKey(keyBytes, compressed);
    } catch {
      return null;
    }
  },

  pointAddScalar(
    point: Uint8Array | Buffer,
    scalar: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array | null {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;

      if (!this.isPoint(pointBytes) || !this.isPrivate(scalarBytes)) return null;

      const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
      const scalarBigInt = bytesToBigInt(scalarBytes);
      const scalarPoint = secp256k1.ProjectivePoint.BASE.multiply(scalarBigInt);
      const result = p.add(scalarPoint);

      const isCompressed = compressed !== undefined ? compressed : pointBytes.length === 33;
      return result.toRawBytes(isCompressed);
    } catch {
      return null;
    }
  },

  privateAdd(privateKey: Uint8Array | Buffer, scalar: Uint8Array | Buffer): Uint8Array | null {
    try {
      const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;

      if (!this.isPrivate(keyBytes) || !this.isPrivate(scalarBytes)) return null;

      const keyBigInt = bytesToBigInt(keyBytes);
      const scalarBigInt = bytesToBigInt(scalarBytes);
      const CURVE_ORDER = BigInt(
        "0xFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFFEBAAEDCE6AF48A03BBFD25E8CD0364141",
      );
      const result = (keyBigInt + scalarBigInt) % CURVE_ORDER;

      if (result === 0n) return null;

      return bigIntToBytes(result);
    } catch {
      return null;
    }
  },

  pointMultiply(
    point: Uint8Array | Buffer,
    scalar: Uint8Array | Buffer,
    compressed?: boolean,
  ): Uint8Array | null {
    try {
      const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
      const scalarBytes = scalar instanceof Buffer ? new Uint8Array(scalar) : scalar;

      if (!this.isPoint(pointBytes) || !this.isPrivate(scalarBytes)) return null;

      const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
      const scalarBigInt = bytesToBigInt(scalarBytes);
      const result = p.multiply(scalarBigInt);

      const isCompressed = compressed !== undefined ? compressed : pointBytes.length === 33;
      return result.toRawBytes(isCompressed);
    } catch {
      return null;
    }
  },

  pointCompress(point: Uint8Array | Buffer, compressed = true): Uint8Array {
    const pointBytes = point instanceof Buffer ? new Uint8Array(point) : point;
    const p = secp256k1.ProjectivePoint.fromHex(pointBytes);
    return p.toRawBytes(compressed);
  },

  isPointCompressed(point: Uint8Array | Buffer): boolean {
    return point.length === 33;
  },

  // Additional utilities for compatibility with TinySecp256k1Interface
  sign(hash: Uint8Array | Buffer, privateKey: Uint8Array | Buffer): Uint8Array {
    const hashBytes = hash instanceof Buffer ? new Uint8Array(hash) : hash;
    const keyBytes = privateKey instanceof Buffer ? new Uint8Array(privateKey) : privateKey;
    const signature = secp256k1.sign(hashBytes, keyBytes, { prehash: false });
    return signature.toCompactRawBytes();
  },

  verify(
    hash: Uint8Array | Buffer,
    publicKey: Uint8Array | Buffer,
    signature: Uint8Array | Buffer,
  ): boolean {
    try {
      const hashBytes = hash instanceof Buffer ? new Uint8Array(hash) : hash;
      const pubKeyBytes = publicKey instanceof Buffer ? new Uint8Array(publicKey) : publicKey;
      const sigBytes = signature instanceof Buffer ? new Uint8Array(signature) : signature;
      return secp256k1.verify(sigBytes, hashBytes, pubKeyBytes, { prehash: false });
    } catch {
      return false;
    }
  },
};

// Helper functions for bigint conversion
function bytesToBigInt(bytes: Uint8Array): bigint {
  const hex = Array.from(bytes)
    .map(b => b.toString(16).padStart(2, "0"))
    .join("");
  return BigInt("0x" + hex);
}

function bigIntToBytes(value: bigint): Uint8Array {
  const hex = value.toString(16).padStart(64, "0");
  const bytes = new Uint8Array(32);
  for (let i = 0; i < 32; i++) {
    bytes[i] = parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  }
  return bytes;
}

export function readUint64LE(buffer: Buffer, offset = 0): number {
  const low = buffer.readUInt32LE(offset);
  const high = buffer.readUInt32LE(offset + 4);
  return high * 0x100000000 + low;
}

function getXpub(seed: Buffer, path: string): Promise<string> {
  const bip32 = BIP32Factory(eccWrapper);
  const root = bip32.fromSeed(seed, bitcoin.networks.regtest);
  const node = root.derivePath(path);
  const xpub = node.neutered().toBase58();

  return Promise.resolve(xpub);
}

function getPublicKey(seed: Buffer, path: string): Promise<BitcoinAddress> {
  const bip32 = BIP32Factory(eccWrapper);
  const root = bip32.fromSeed(seed, bitcoin.networks.regtest);
  const node = root.derivePath(path);
  const { chainCode, publicKey } = node;
  const p2wpkh = bitcoin.payments.p2wpkh({ pubkey: publicKey, network: bitcoin.networks.regtest });
  const address =
    bitcoin.payments.p2sh({ redeem: p2wpkh, network: bitcoin.networks.regtest }).address ?? "";
  const uncompressed = eccWrapper.pointCompress(publicKey, false);

  return Promise.resolve({
    bitcoinAddress: address,
    publicKey: Buffer.from(uncompressed).toString("hex"),
    chainCode: (Buffer.isBuffer(chainCode)
      ? chainCode
      : Buffer.from(new Uint8Array(chainCode))
    ).toString("hex"),
  });
}

function createPaymentTransaction(seed: Buffer, arg: CreateTransaction): Promise<string> {
  const bip32 = BIP32Factory(eccWrapper);
  const root = bip32.fromSeed(seed, bitcoin.networks.regtest);

  const tx = new bitcoin.Psbt({ network: bitcoin.networks.regtest });

  if (typeof arg.lockTime === "number") tx.setLocktime(arg.lockTime);
  tx.setVersion(2);

  for (let i = 0; i < arg.inputs.length; i++) {
    const input = arg.inputs[i];
    if (!input[0].outputs) throw Error("Missing outputs array in transaction to sign");

    const inputTxBuffer = serializeTransaction(input[0], true);
    const inputTxid = bitcoin.crypto.hash256(inputTxBuffer);
    const spentOutputIndex = input[1];
    const spentTxOutput = input[0].outputs[spentOutputIndex];
    const amount =
      (spentTxOutput.amount.readUInt32LE(4) << 32) + spentTxOutput.amount.readUInt32LE(0);
    const sequence = input[3];
    const inputNode = root.derivePath(arg.associatedKeysets[i]);
    const inputP2wpkh = bitcoin.payments.p2wpkh({
      pubkey: inputNode.publicKey,
      network: bitcoin.networks.regtest,
    });
    const inputRedeemScript = bitcoin.payments.p2sh({
      redeem: inputP2wpkh,
      network: bitcoin.networks.regtest,
    }).redeem!.output!;

    tx.addInput({
      hash: inputTxid, // `hash` it not valid with TypeScript, but mandatory
      index: spentOutputIndex,
      redeemScript: inputRedeemScript,
      witnessUtxo: { value: amount, script: spentTxOutput.script },
      sighashType: arg.sigHashType,
      ...(typeof sequence === "number" ? { sequence } : {}),
      ...(typeof arg.sigHashType === "number" ? { sighashType: arg.sigHashType } : {}),
    } as any);
  }

  const outputsConcat = Buffer.from(arg.outputScriptHex, "hex");
  const outputsBufferReader = new BufferReader(outputsConcat);
  const outputCount = outputsBufferReader.readVarInt();

  for (let i = 0; i < outputCount; i++) {
    const amount = outputsBufferReader.readUInt64();
    const outputScript = outputsBufferReader.readVarSlice();

    tx.addOutput({ value: amount, script: outputScript });
  }

  for (let i = 0; i < tx.inputCount; i++) {
    const inputNode = root.derivePath(arg.associatedKeysets[i]);
    tx.signInput(i, inputNode);
  }

  tx.finalizeAllInputs();
  return Promise.resolve(tx.extractTransaction().toHex());
}

export async function buildSigner(): Promise<BitcoinSigner> {
  const mnemonic = generateMnemonic();
  const seed = await mnemonicToSeed(mnemonic);

  return {
    getWalletPublicKey: path => getPublicKey(seed, path),
    getWalletXpub: ({ path }) => getXpub(seed, path),
    splitTransaction: (arg1, arg2, arg3, arg4) => {
      return splitTransaction(arg1, arg2, arg3 ?? false, arg4 ?? []);
    },
    createPaymentTransaction: arg => createPaymentTransaction(seed, arg),
    signMessage: () => {
      throw new Error("Not implemented");
    },
  };
}

/**
 * Software signer for the **generic-adapter** strategy — native SegWit (P2WPKH / bech32) only, to
 * keep PSBT signing simple (no redeem script). It plays the role of the device on the Alpaca path:
 * the generic `signOperation` calls `signTransaction(path, unsignedPSBT)`, and we return a
 * partially-signed PSBT that coin-bitcoin's `combine` finalizes.
 */
export type GenericBitcoinSigner = {
  getAddress: (path: string) => Promise<{ address: string; publicKey: string }>;
  getXpub: (accountPath: string) => Promise<string>;
  signTransaction: (path: string, unsignedPsbtBase64: string) => Promise<string>;
};

const REGTEST = bitcoin.networks.regtest;
const stripM = (path: string): string => path.replace(/^m\//, "");
const p2wpkhScript = (pubkey: Buffer): Buffer =>
  bitcoin.payments.p2wpkh({ pubkey, network: REGTEST }).output!;

export async function buildGenericSigner(
  mnemonic: string = generateMnemonic(),
): Promise<{ signer: GenericBitcoinSigner; mnemonic: string }> {
  const seed = await mnemonicToSeed(mnemonic);
  const bip32 = BIP32Factory(eccWrapper);
  const root = bip32.fromSeed(seed, REGTEST);

  const signer: GenericBitcoinSigner = {
    getAddress: async (path: string) => {
      const node = root.derivePath(stripM(path));
      const address = bitcoin.payments.p2wpkh({
        pubkey: node.publicKey,
        network: REGTEST,
      }).address!;
      return { address, publicKey: Buffer.from(node.publicKey).toString("hex") };
    },

    getXpub: async (accountPath: string) =>
      root.derivePath(stripM(accountPath)).neutered().toBase58(),

    // The account walk crafts a PSBT whose inputs come from several derived addresses. We only get
    // the account-leaf `path` here, so for each input we scan the receive (0) and change (1) chains
    // and match the derived P2WPKH script against the input's witnessUtxo, then sign with that key.
    signTransaction: async (path: string, unsignedPsbtBase64: string) => {
      const accountPath = stripM(path).split("/").slice(0, 3).join("/"); // purpose'/coin'/account'
      const accountNode = root.derivePath(accountPath);
      const psbt = bitcoin.Psbt.fromBase64(unsignedPsbtBase64, { network: REGTEST });

      const GAP = 40;
      for (let i = 0; i < psbt.inputCount; i++) {
        const script = psbt.data.inputs[i]?.witnessUtxo?.script;
        if (!script) {
          throw new Error(`generic signer: input ${i} has no witnessUtxo (native segwit expected)`);
        }
        let signed = false;
        for (let chain = 0; chain <= 1 && !signed; chain++) {
          for (let index = 0; index < GAP; index++) {
            const child = accountNode.derive(chain).derive(index);
            if (Buffer.compare(p2wpkhScript(Buffer.from(child.publicKey)), script) === 0) {
              psbt.signInput(i, child);
              signed = true;
              break;
            }
          }
        }
        if (!signed) throw new Error(`generic signer: no HD key matched input ${i}`);
      }
      // Not finalized — coin-bitcoin's `combine` finalizes and extracts the raw tx.
      return psbt.toBase64();
    },
  };

  return { signer, mnemonic };
}
