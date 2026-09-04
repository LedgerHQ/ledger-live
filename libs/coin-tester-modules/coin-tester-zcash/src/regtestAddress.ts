/**
 * Re-encodes a mainnet-formatted Zcash address (t1/t3 Base58Check, or a
 * bech32m unified address with HRP "u") into its byte-identical regtest
 * equivalent (t-address version 0x1d25/0x1cba, unified address HRP
 * "uregtest").
 *
 * Why this exists: `coin-zcash`'s own recipient classifier
 * (`logic/address.ts`'s `classifyZcashRecipient`) only recognizes mainnet
 * address encodings, so every address this package's signer/scenario
 * produces or targets (see `signer.ts`, `zcash_regtest.ts`) is deliberately
 * mainnet-formatted -- see those files for the full rationale. But
 * `@ledgerhq/zcash-utils`'s native builder (`buildTransaction`/
 * `buildIronwoodTransaction`), once given `network: "regtest"` (required so
 * the NU5/NU6.3 activation-height gate is satisfiable at all on a regtest
 * chain -- see `zcashClientTestSeam.ts`), decodes every `outputs[].address`
 * against *regtest's own* encoding rules and rejects anything else with
 * "invalid destination address" (empirically confirmed against the real
 * native addon). This module bridges that gap entirely within this
 * test-only package: `zcashClientTestSeam.ts` re-encodes each output address
 * through this function immediately before the real build call, so neither
 * `@ledgerhq/coin-zcash` nor `@ledgerhq/wallet-btc` need to know regtest
 * addresses exist at all.
 *
 * The unified-address transform round-trips exactly (mainnet -> regtest ->
 * mainnet reproduces the original bech32m string byte-for-byte) because it
 * un-jumbles with ZIP-316's "u" + 15 zero-byte padding, replaces it with
 * "uregtest" + 8 zero bytes, and re-jumbles -- the F4Jumble transform itself
 * (ZIP-316 section 3, ported from librustzcash's `f4jumble` crate) mixes the
 * padding bytes into the whole blob, so a naive HRP string swap on the
 * already-jumbled bytes (which was tried and empirically failed first) is
 * not sufficient; the padding must be replaced *before* re-jumbling.
 */
import { randomBytes } from "node:crypto";
import { blake2b } from "@noble/hashes/blake2b";
import bs58 from "bs58";
import { sha256 } from "@noble/hashes/sha2";
import { bech32m } from "@ledgerhq/wallet-btc/crypto/bech32m";

const PADDING_LEN = 16;
const MAINNET_UA_HRP = "u";
const REGTEST_UA_HRP = "uregtest";

// Regtest shares its transparent Base58Check version bytes with testnet
// (zcash_protocol's `constants::{testnet,regtest}::B58_{PUBKEY,SCRIPT}_ADDRESS_PREFIX`
// are byte-identical); only the unified-address HRP differs from testnet's "utest".
const MAINNET_P2PKH_VERSION = 0x1cb8;
const MAINNET_P2SH_VERSION = 0x1cbd;
const REGTEST_P2PKH_VERSION = 0x1d25;
const REGTEST_P2SH_VERSION = 0x1cba;

function hPers(i: number): Uint8Array {
  const p = new Uint8Array(16);
  const s = "UA_F4Jumble_H";
  for (let k = 0; k < s.length; k++) p[k] = s.charCodeAt(k);
  p[13] = i;
  return p;
}

function gPers(i: number, j: number): Uint8Array {
  const p = new Uint8Array(16);
  const s = "UA_F4Jumble_G";
  for (let k = 0; k < s.length; k++) p[k] = s.charCodeAt(k);
  p[13] = i;
  p[14] = j & 0xff;
  p[15] = (j >> 8) & 0xff;
  return p;
}

type JumbleRounds = { hRound: (i: number) => void; gRound: (i: number) => void };

function makeJumbleRounds(left: Uint8Array, right: Uint8Array): JumbleRounds {
  return {
    hRound(i: number): void {
      const h = blake2b(right, { dkLen: left.length, personalization: hPers(i) });
      for (let k = 0; k < left.length; k++) left[k] ^= h[k];
    },
    gRound(i: number): void {
      const rightLen = right.length;
      const chunks = Math.ceil(rightLen / 64);
      for (let j = 0; j < chunks; j++) {
        const h = blake2b(left, { dkLen: 64, personalization: gPers(i, j) });
        const chunkSize = Math.min(64, rightLen - j * 64);
        for (let k = 0; k < chunkSize; k++) right[j * 64 + k] ^= h[k];
      }
    },
  };
}

/** ZIP-316 section 3 F4Jumble, forward direction (round order g0, h0, g1, h1). */
function f4jumbleForward(bytes: Uint8Array): Uint8Array {
  const leftLen = Math.min(64, Math.floor(bytes.length / 2));
  const left = bytes.slice(0, leftLen);
  const right = bytes.slice(leftLen);
  const { hRound, gRound } = makeJumbleRounds(left, right);
  gRound(0);
  hRound(0);
  gRound(1);
  hRound(1);
  const result = new Uint8Array(bytes.length);
  result.set(left, 0);
  result.set(right, leftLen);
  return result;
}

/** ZIP-316 section 3 F4Jumble, inverse direction (round order h1, g1, h0, g0). */
function f4jumbleInverse(bytes: Uint8Array): Uint8Array {
  const leftLen = Math.min(64, Math.floor(bytes.length / 2));
  const left = bytes.slice(0, leftLen);
  const right = bytes.slice(leftLen);
  const { hRound, gRound } = makeJumbleRounds(left, right);
  hRound(1);
  gRound(1);
  hRound(0);
  gRound(0);
  const result = new Uint8Array(bytes.length);
  result.set(left, 0);
  result.set(right, leftLen);
  return result;
}

function reencodeUnifiedAddress(address: string, fromHrp: string, toHrp: string): string {
  const decoded = bech32m.decode(address, 512);
  if (decoded.prefix !== fromHrp) {
    throw new Error(`Expected unified address with HRP "${fromHrp}", got "${decoded.prefix}"`);
  }
  const jumbled = new Uint8Array(bech32m.fromWords(decoded.words));
  const padded = f4jumbleInverse(jumbled);
  const receiverBytes = padded.slice(0, padded.length - PADDING_LEN);

  const newPadding = new Uint8Array(PADDING_LEN);
  for (let k = 0; k < toHrp.length; k++) newPadding[k] = toHrp.charCodeAt(k);
  const newPadded = new Uint8Array(receiverBytes.length + PADDING_LEN);
  newPadded.set(receiverBytes, 0);
  newPadded.set(newPadding, receiverBytes.length);

  const newJumbled = f4jumbleForward(newPadded);
  return bech32m.encode(toHrp, bech32m.toWords(Array.from(newJumbled)), 512);
}

function reencodeTransparentAddress(address: string, toVersion: number): string {
  const decoded = bs58.decode(address);
  if (decoded.length !== 26) {
    throw new Error(`Expected a 26-byte Base58Check t-address, got ${decoded.length} bytes`);
  }
  return encodeP2pkhAddress(toVersion, decoded.subarray(2, 22));
}

function transparentVersion(address: string): number {
  return Buffer.from(bs58.decode(address).subarray(0, 2)).readUInt16BE(0);
}

/**
 * Re-encodes a mainnet-formatted t1/t3/unified address into its regtest
 * equivalent. Returns the input unchanged if it is not one of the mainnet
 * encodings this package's signer/currency produce (defensive default; every
 * real caller here only ever passes one of those two shapes).
 */
export function toRegtestAddress(mainnetAddress: string): string {
  if (mainnetAddress.startsWith(`${MAINNET_UA_HRP}1`)) {
    return reencodeUnifiedAddress(mainnetAddress, MAINNET_UA_HRP, REGTEST_UA_HRP);
  }
  if (
    mainnetAddress.length === 35 &&
    (mainnetAddress.startsWith("t1") || mainnetAddress.startsWith("t3"))
  ) {
    const version = transparentVersion(mainnetAddress);
    const toVersion =
      version === MAINNET_P2PKH_VERSION
        ? REGTEST_P2PKH_VERSION
        : version === MAINNET_P2SH_VERSION
          ? REGTEST_P2SH_VERSION
          : undefined;
    if (toVersion === undefined) {
      throw new Error(`Unrecognised transparent address version 0x${version.toString(16)}`);
    }
    return reencodeTransparentAddress(mainnetAddress, toVersion);
  }
  return mainnetAddress;
}

/**
 * Inverse of {@link toRegtestAddress}: re-encodes a regtest-formatted t/tm/
 * unified address back into its mainnet equivalent. Needed because zebra's
 * own address-indexed RPCs (`getaddressutxos`/`getaddresstxids`, consumed by
 * indexer.ts) require addresses encoded for zebra's own configured network
 * (Regtest) -- passing a mainnet-encoded address is not an error, it just
 * silently matches nothing (empirically confirmed: a real coinbase UTXO is
 * only returned under the regtest-encoded address, never under the
 * mainnet-encoded one) -- while every address the RPC responses embed
 * (`scriptPubKey.addresses`) comes back regtest-encoded and must be converted
 * back before reaching `@ledgerhq/coin-zcash`'s mainnet-only classifier.
 */
export function fromRegtestAddress(regtestAddress: string): string {
  if (regtestAddress.startsWith(`${REGTEST_UA_HRP}1`)) {
    return reencodeUnifiedAddress(regtestAddress, REGTEST_UA_HRP, MAINNET_UA_HRP);
  }
  if (
    regtestAddress.length === 35 &&
    (regtestAddress.startsWith("tm") || regtestAddress.startsWith("t2"))
  ) {
    const version = transparentVersion(regtestAddress);
    const toVersion =
      version === REGTEST_P2PKH_VERSION
        ? MAINNET_P2PKH_VERSION
        : version === REGTEST_P2SH_VERSION
          ? MAINNET_P2SH_VERSION
          : undefined;
    if (toVersion === undefined) {
      throw new Error(`Unrecognised transparent address version 0x${version.toString(16)}`);
    }
    return reencodeTransparentAddress(regtestAddress, toVersion);
  }
  return regtestAddress;
}

function encodeP2pkhAddress(version: number, hash160: Uint8Array): string {
  const payload = new Uint8Array(22);
  payload[0] = (version >> 8) & 0xff;
  payload[1] = version & 0xff;
  payload.set(hash160, 2);
  const checksum = sha256(sha256(payload)).slice(0, 4);
  const full = new Uint8Array(26);
  full.set(payload, 0);
  full.set(checksum, 22);
  return bs58.encode(Buffer.from(full));
}

/**
 * A fresh regtest P2PKH address with no known private key, for mining blocks
 * whose coinbase reward must never enter the test account's own balance.
 *
 * `@ledgerhq/coin-zcash`'s transparent send flow spends every UTXO the
 * account holds unconditionally (`resolveTransparentUtxos` -- there is no
 * amount-driven coin selection), and Zcash's coinbase maturity rule makes a
 * coinbase output unspendable for 100 blocks after it was mined regardless of
 * `should_allow_unshielded_coinbase_spends` (which only lifts the *shielding*
 * requirement, empirically confirmed against the real zebrad binary). So the
 * moment the account holds even one block's worth of coinbase newer than
 * `tip - 100`, every transparent send it attempts fails with "immature
 * transparent coinbase spend" -- and since regtest's single static
 * `mining.miner_address` pays every block to whichever address it names,
 * continuing to mine confirmation/padding blocks to the account's own address
 * would recreate that immature UTXO on every block forever. Mining those
 * blocks to this burn address instead (see helpers.ts's
 * `generateBlocksToAddress`, backed by zebra's `generatetoaddress` RPC)
 * confirms the chain without ever handing the account a UTXO it cannot spend.
 *
 * Passed directly to zebra's own RPC (`generatetoaddress`), which -- like
 * `mining.miner_address` -- expects an address encoded for its own configured
 * network. Not to be confused with {@link randomMainnetBurnAddress}, needed
 * wherever an address instead crosses `@ledgerhq/coin-zcash`'s mainnet-only
 * classifier first.
 */
export function randomRegtestBurnAddress(): string {
  return encodeP2pkhAddress(REGTEST_P2PKH_VERSION, randomBytes(20));
}

/**
 * A fresh mainnet-formatted P2PKH address with no known private key, for a
 * scenario transaction that must send to a genuinely external recipient --
 * as opposed to `transparentRecipientAddress` (the account's own address),
 * which some flows in this package deliberately reuse as a destination (e.g.
 * de-shielding into the same account's transparent balance).
 *
 * Mainnet-formatted, not regtest: this is consumed at the `@ledgerhq/coin-zcash`
 * scenario layer (a transaction's `recipient` field), which classifies
 * addresses against mainnet prefixes only (see `zcash_regtest.ts`) --
 * `zcashClientTestSeam.ts`'s own `toRegtestAddress` conversion re-encodes it
 * for the native builder later, exactly like every other address this
 * package hands to `coin-zcash`.
 */
export function randomMainnetBurnAddress(): string {
  return encodeP2pkhAddress(MAINNET_P2PKH_VERSION, randomBytes(20));
}
