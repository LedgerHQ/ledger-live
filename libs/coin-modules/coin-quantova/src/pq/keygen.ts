/**
 * Post-quantum key generation + signing via Quantova's **qweb3.js** SDK.
 *
 * qweb3.js ships the proven PQ stack used by every Quantova signer:
 *   - `@quantova/keyring`      — a per-scheme Keyring (Dilithium / Falcon / SPHINCS+)
 *   - `@quantova/util-crypto`  — `cryptoWaitReady` + WASM-crypto registration
 *   - `@quantova/falcon-wasm`  — the audited PQ primitives (`*_pair_from_seed`, `*_sign`)
 *
 * We wrap that surface behind a small adapter so this module compiles without the SDK at
 * type-check time, and so an on-device app can later implement the SAME `QPair` contract.
 * The reference implementation here is a **software** signer (keys in memory) — it proves
 * the end-to-end flow and is the exact spec a Ledger device app must reproduce on-chip.
 */
import { QScheme, QSCHEMES } from "./schemes";
import { isValidQAddress } from "../logic/address";

/** A post-quantum keypair, however its private material is held (software or device). */
export interface QPair {
  scheme: QScheme;
  /** canonical "Q1…" address */
  address: string;
  /** PQ public key bytes (length matches the scheme) */
  publicKey: Uint8Array;
  /** produce a PQ signature over `message` */
  sign(message: Uint8Array): Promise<Uint8Array> | Uint8Array;
}

/** Loads and initialises the qweb3.js PQ stack once (idempotent). */
let sdkReady: Promise<{ Keyring: new (opts: { type: string }) => Qweb3Keyring }> | null = null;

interface Qweb3Keyring {
  addFromSeed(seed: Uint8Array): Qweb3Pair;
  addFromUri(uri: string): Qweb3Pair;
  addFromMnemonic(mnemonic: string): Qweb3Pair;
}
interface Qweb3Pair {
  address: string;
  publicKey: Uint8Array;
  sign(message: Uint8Array): Uint8Array;
}

async function loadQweb3() {
  if (!sdkReady) {
    sdkReady = (async () => {
      // qweb3.js re-exports these; importing the scoped packages keeps us on the proven path.
      const [{ Keyring }, utilCrypto, falconWasm] = await Promise.all([
        import("@quantova/keyring"),
        import("@quantova/util-crypto"),
        import("@quantova/falcon-wasm"),
      ]);
      await utilCrypto.cryptoWaitReady();
      // Register the WASM PQ primitives with the keyring (exactly as Quantova's signers do).
      utilCrypto.setSphincspWasmCrypto?.(falconWasm);
      utilCrypto.setFalconWasmCrypto?.(falconWasm);
      utilCrypto.setDilithiumWasmCrypto?.(falconWasm);
      return { Keyring };
    })();
  }
  return sdkReady;
}

/** Build a software `QPair` from a 32-byte seed (testing / reference signing only). */
export async function pairFromSeed(scheme: QScheme, seed: Uint8Array): Promise<QPair> {
  const { Keyring } = await loadQweb3();
  const kr = new Keyring({ type: scheme });
  const pair = kr.addFromSeed(seed);
  return wrap(scheme, pair);
}

/** Build a software `QPair` from a Quantova URI / mnemonic (reference signing only). */
export async function pairFromUri(scheme: QScheme, uri: string): Promise<QPair> {
  const { Keyring } = await loadQweb3();
  const kr = new Keyring({ type: scheme });
  const pair = uri.includes(" ") ? kr.addFromMnemonic(uri) : kr.addFromUri(uri);
  return wrap(scheme, pair);
}

function wrap(scheme: QScheme, pair: Qweb3Pair): QPair {
  if (pair.publicKey.length !== QSCHEMES[scheme].publicKeyLength) {
    throw new Error(`${QSCHEMES[scheme].label}: unexpected public key length`);
  }
  if (!isValidQAddress(pair.address)) {
    throw new Error(`qweb3.js returned a non-canonical address: ${pair.address}`);
  }
  return {
    scheme,
    address: pair.address,
    publicKey: pair.publicKey,
    sign: (message: Uint8Array) => pair.sign(message),
  };
}
