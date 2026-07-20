import ecc from "@bitcoinerlab/secp256k1";
import BIP32Factory from "bip32";
import { mnemonicToSeed } from "bip39";
import { schnorr, secp256k1 } from "@noble/curves/secp256k1";
import { blake2b } from "@noble/hashes/blake2b";
import type { KaspaSigner } from "@ledgerhq/coin-kaspa/types/signer";
import type { KaspaAddress } from "@ledgerhq/coin-kaspa/types/signer";
import { KaspaHwTransaction } from "@ledgerhq/coin-kaspa/types/kaspaHwTransaction";
import { publicKeyToAddress } from "@ledgerhq/coin-kaspa/logic/kaspaAddresses";
import type { UnsignedKaspaTransaction } from "@ledgerhq/coin-kaspa/logic/transaction/craftTransaction";

export const KASPA_TEST_MNEMONIC =
  "abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon abandon about";

// Recipient mnemonic — intentionally different from KASPA_TEST_MNEMONIC so the
// recipient address is never discovered by the legacy bridge's HD scanner.
export const KASPA_RECIPIENT_MNEMONIC =
  "test test test test test test test test test test test junk";

// Kaspa BIP44 coin type (from bridgeDatasetTest.ts freshAddressPath "44'/111111'/0'/0/1")
const KASPA_COIN_TYPE = 111111;

// Kaspa uses BLAKE2b-256 in keyed mode for ALL hashes in the sighash preimage.
// The key is the RAW string "TransactionSigningHash" (22 bytes) — NOT its hash.
// Source: kaspa_hashes/src/hashers.rs blake2b_hasher! macro expands to
//   blake2b_simd::Params::new().hash_length(32).key(b"TransactionSigningHash").to_state()
const KASPA_SIGNING_KEY = new TextEncoder().encode("TransactionSigningHash");

function kaspaSigningHash(data: Uint8Array): Uint8Array {
  return blake2b(data, { key: KASPA_SIGNING_KEY, dkLen: 32 });
}

// Zero hash: kaspa returns 32 zero bytes for native subnetwork transactions with empty payload.
// See payload_hash() in sighash.rs: `if tx.subnetwork_id.is_native() && tx.payload.is_empty() { return ZERO_HASH }`.
const ZERO_HASH = Buffer.alloc(32);

// Build the 99-byte extended public key expected by coin-kaspa's parseExtendedPublicKey:
//   [0x41][04 ‖ x ‖ y (65 bytes)][0x20][chainCode (32 bytes)]
export function buildKaspaXpub(compressedPubKey: Buffer, chainCode: Buffer): string {
  const point = secp256k1.ProjectivePoint.fromHex(compressedPubKey.toString("hex"));
  const uncompressed = point.toRawBytes(false); // 04 ‖ x ‖ y
  return Buffer.concat([
    Buffer.from([0x41]),
    Buffer.from(uncompressed),
    Buffer.from([0x20]),
    chainCode,
  ]).toString("hex");
}

type TxForSighash = {
  version: number;
  inputs: Array<{ prevTxId: string; outpointIndex: number; value: number }>;
  outputs: Array<{ value: number; scriptPublicKey: string }>;
};

function computeHashPrevOuts(inputs: TxForSighash["inputs"]): Uint8Array {
  const parts = inputs.map(inp => {
    const b = Buffer.allocUnsafe(36);
    Buffer.from(inp.prevTxId, "hex").copy(b, 0);
    b.writeUInt32LE(inp.outpointIndex, 32);
    return b;
  });
  return kaspaSigningHash(Buffer.concat(parts));
}

function computeHashSequences(count: number): Uint8Array {
  // All Kaspa input sequences are 0; write count * 8 zero bytes.
  return kaspaSigningHash(Buffer.alloc(count * 8));
}

function computeHashSigOpCounts(count: number): Uint8Array {
  // Each P2PK input has sigOpCount = 1.
  return kaspaSigningHash(Buffer.alloc(count).fill(1));
}

function computeHashOutputs(outputs: TxForSighash["outputs"]): Uint8Array {
  const parts: Buffer[] = [];
  for (const out of outputs) {
    const scriptBytes = Buffer.from(out.scriptPublicKey, "hex");
    const amtBuf = Buffer.allocUnsafe(8);
    amtBuf.writeBigUInt64LE(BigInt(out.value), 0);
    const versionBuf = Buffer.allocUnsafe(2);
    versionBuf.writeUInt16LE(0, 0);
    const lenBuf = Buffer.allocUnsafe(8);
    lenBuf.writeBigUInt64LE(BigInt(scriptBytes.length), 0);
    parts.push(amtBuf, versionBuf, lenBuf, scriptBytes);
  }
  return kaspaSigningHash(Buffer.concat(parts));
}

// Compute the per-input sighash (SIGHASH_ALL) for a Kaspa transaction.
// Field order verified against rusty-kaspa consensus/core/src/hashing/sighash.rs
// calc_schnorr_signature_hash(). All hashes (inner and outer) use the single
// "TransactionSigningHash" keyed BLAKE2B domain.
export function computeInputSighash(
  tx: TxForSighash,
  inputIndex: number,
  scriptPublicKey: string,
): Uint8Array {
  const hashPO = computeHashPrevOuts(tx.inputs);
  const hashSQ = computeHashSequences(tx.inputs.length);
  const hashSOC = computeHashSigOpCounts(tx.inputs.length); // included for tx.version == 0 (< 1)
  const hashOP = computeHashOutputs(tx.outputs);
  const input = tx.inputs[inputIndex];
  const scriptBytes = Buffer.from(scriptPublicKey, "hex");

  const parts: Buffer[] = [];
  // version: u16-LE (first field — NO sigHashType prefix)
  const vBuf = Buffer.allocUnsafe(2);
  vBuf.writeUInt16LE(tx.version, 0);
  parts.push(vBuf);
  // sub-hashes
  parts.push(Buffer.from(hashPO));
  parts.push(Buffer.from(hashSQ));
  parts.push(Buffer.from(hashSOC)); // only for version < 1 (version 0)
  // outpoint: txId (32 bytes) + index (u32-LE)
  parts.push(Buffer.from(input.prevTxId, "hex"));
  const idxBuf = Buffer.allocUnsafe(4);
  idxBuf.writeUInt32LE(input.outpointIndex, 0);
  parts.push(idxBuf);
  // script public key: version (u16-LE) + varint length (u8 for <253) + bytes
  const spkVersionBuf = Buffer.allocUnsafe(2);
  spkVersionBuf.writeUInt16LE(0, 0);
  parts.push(spkVersionBuf);
  const spkLenBuf = Buffer.allocUnsafe(8);
  spkLenBuf.writeBigUInt64LE(BigInt(scriptBytes.length), 0);
  parts.push(spkLenBuf);
  parts.push(scriptBytes);
  // amount: u64-LE — BEFORE sequence (matches .write_u64(amount).write_u64(sequence) in rust)
  const valueBuf = Buffer.allocUnsafe(8);
  valueBuf.writeBigUInt64LE(BigInt(input.value), 0);
  parts.push(valueBuf);
  // sequence: u64-LE (always 0)
  parts.push(Buffer.alloc(8));
  // sigOpCount: u8 (always 1, only for version < 1)
  parts.push(Buffer.from([0x01]));
  // outputs hash
  parts.push(Buffer.from(hashOP));
  // lockTime: u64-LE (always 0)
  parts.push(Buffer.alloc(8));
  // subnetworkId: 20 bytes (zeros = native)
  parts.push(Buffer.alloc(20));
  // gas: u64-LE (always 0)
  parts.push(Buffer.alloc(8));
  // payload hash: ZERO_HASH for native subnetwork with empty payload
  parts.push(ZERO_HASH);
  // sigHashType: u8 — AT THE END (not at the beginning)
  parts.push(Buffer.from([0x01])); // SIGHASH_ALL

  return kaspaSigningHash(Buffer.concat(parts));
}

export type GenericKaspaSigner = {
  getAddress: (
    path: string,
    opts?: unknown,
  ) => Promise<{ address: string; publicKey: string }>;
  signTransaction: (
    path: string,
    unsignedJson: string,
    opts?: unknown,
  ) => Promise<string>;
};

export type Signers = {
  bridge: KaspaSigner;
  generic: GenericKaspaSigner;
};

export async function buildSigners(mnemonic = KASPA_TEST_MNEMONIC): Promise<Signers> {
  const bip32 = BIP32Factory(ecc);
  const seed = await mnemonicToSeed(mnemonic);
  const root = bip32.fromSeed(seed);
  const accountNode = root.derivePath(`m/44'/${KASPA_COIN_TYPE}'/0'`);

  const accountXpub = buildKaspaXpub(
    Buffer.from(accountNode.publicKey),
    Buffer.from(accountNode.chainCode),
  );

  function xCoordToP2PKScript(xCoord: Buffer): string {
    return "20" + xCoord.toString("hex") + "ac";
  }

  const bridge: KaspaSigner = {
    getAddress: async (path: string): Promise<KaspaAddress> => {
      const node = root.derivePath("m/" + path);
      const xCoord = Buffer.from(node.publicKey.subarray(1, 33));
      const address = publicKeyToAddress(xCoord);
      // publicKey is the account-level 99-byte xpub; coin-kaspa's hw-getAddress sets
      // account.xpub from it, which drives the HD address scanner in synchronization.ts.
      return { address, publicKey: accountXpub };
    },

    signMessage: async () => {
      throw new Error("signMessage not implemented in coin-tester signer");
    },

    signTransaction: async (tx: KaspaHwTransaction): Promise<void> => {
      const txForSighash: TxForSighash = {
        version: tx.version,
        inputs: tx.inputs.map(i => ({
          prevTxId: i.prevTxId,
          outpointIndex: i.outpointIndex,
          value: i.value,
        })),
        outputs: tx.outputs.map(o => ({
          value: o.value,
          scriptPublicKey: o.scriptPublicKey,
        })),
      };
      for (let i = 0; i < tx.inputs.length; i++) {
        const input = tx.inputs[i];
        // addressType and addressIndex are the HD child indices set by buildTransaction.
        const child = accountNode.derive(input.addressType).derive(input.addressIndex);
        if (!child.privateKey) throw new Error("bip32: missing private key");
        const xCoord = Buffer.from(child.publicKey.subarray(1, 33));
        const script = xCoordToP2PKScript(xCoord);
        const sighash = computeInputSighash(txForSighash, i, script);
        const sig = schnorr.sign(sighash, child.privateKey);
        input.setSignature(Buffer.from(sig).toString("hex"));
      }
    },
  };

  const generic: GenericKaspaSigner = {
    getAddress: async (path: string): Promise<{ address: string; publicKey: string }> => {
      const node = root.derivePath("m/" + path);
      const xCoord = Buffer.from(node.publicKey.subarray(1, 33));
      const address = publicKeyToAddress(xCoord);
      // publicKey passes through to transactionIntent.senderPublicKey; combine() ignores it.
      return { address, publicKey: accountXpub };
    },

    signTransaction: async (
      path: string,
      unsignedJson: string,
    ): Promise<string> => {
      const unsigned: UnsignedKaspaTransaction = JSON.parse(unsignedJson);
      // craftTransaction sets accountType/accountIndex to 0/0 placeholders for the Alpaca API
      // (single-address model). Derive the signing key from the leaf path directly.
      const node = root.derivePath("m/" + path);
      if (!node.privateKey) throw new Error("bip32: missing private key at path " + path);
      const xCoord = Buffer.from(node.publicKey.subarray(1, 33));
      const script = xCoordToP2PKScript(xCoord);

      const txForSighash: TxForSighash = {
        version: unsigned.version,
        inputs: unsigned.inputs,
        outputs: unsigned.outputs,
      };
      const sigs = unsigned.inputs.map((_, index) => {
        const sighash = computeInputSighash(txForSighash, index, script);
        const sig = schnorr.sign(sighash, node.privateKey!);
        return Buffer.from(sig).toString("hex");
      });
      return JSON.stringify(sigs);
    },
  };

  return { bridge, generic };
}

export async function deriveAddress(
  mnemonic: string,
  addressType = 0,
  addressIndex = 0,
): Promise<string> {
  const bip32 = BIP32Factory(ecc);
  const seed = await mnemonicToSeed(mnemonic);
  const node = bip32
    .fromSeed(seed)
    .derivePath(`m/44'/${KASPA_COIN_TYPE}'/0'`)
    .derive(addressType)
    .derive(addressIndex);
  const xCoord = Buffer.from(node.publicKey.subarray(1, 33));
  return publicKeyToAddress(xCoord);
}
