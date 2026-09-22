import { NativeModules } from "react-native";

// Bridge to the Zcash Rust engine's C ABI (`zcash-ffi-mobile` in
// LedgerHQ/ledger-zcash-utils), which the app links as an iOS XCFramework and
// as a per-ABI Android `.so`. The Node `.node` addon that desktop uses cannot
// load in a React Native bundle, so mobile reaches the same Rust code through
// this binding instead.
//
// Availability differs by platform, so treat a `ZCASH_FFI_UNAVAILABLE`
// rejection as the only reliable answer:
//
//   iOS     - the pod is skipped entirely when the XCFramework is absent, so
//             the native module does not exist at all.
//   Android - the module is always registered, because probing at
//             registration time would load the library during bridge
//             initialisation on every launch. A build without the engine
//             rejects on the first call instead.
//
// `isZcashFfiAvailable` is therefore a cheap negative check, never a promise
// that a call will succeed.

/** Status codes returned by the C ABI, surfaced as the rejection `code`. */
export const ZCASH_FFI_ERROR_CODES = [
  "ZCASH_FFI_UNAVAILABLE",
  "ZCASH_FFI_NULL_ARG",
  "ZCASH_FFI_INVALID_UTF8",
  "ZCASH_FFI_CRYPTO",
  "ZCASH_FFI_PANIC",
  "ZCASH_FFI_INTERIOR_NUL",
  "ZCASH_FFI_UNKNOWN",
] as const;

export type ZcashFfiErrorCode = (typeof ZCASH_FFI_ERROR_CODES)[number];

/**
 * A failure crossing the FFI boundary.
 *
 * Carries the native status as a code so a caller can tell a malformed key
 * (`ZCASH_FFI_CRYPTO`) from a library that is not there at all
 * (`ZCASH_FFI_UNAVAILABLE`).
 */
export class ZcashFfiError extends Error {
  readonly code: ZcashFfiErrorCode;

  constructor(code: ZcashFfiErrorCode, message: string) {
    super(message);
    this.name = "ZcashFfiError";
    this.code = code;
  }
}

interface ZcashFfiNativeModule {
  /**
   * Derives the Orchard-only unified address the Ledger device displays.
   *
   * Rejects with one of {@link ZCASH_FFI_ERROR_CODES} as the error `code`.
   */
  deriveOrchardAddress(ufvk: string): Promise<string>;

  /** Diagnostic — see {@link runThreadProbe}. */
  threadProbe(ufvk: string, iterations: number): Promise<string>;

  /** Scans a block range — see {@link syncRange}. Resolves with JSON. */
  syncRange(
    ufvk: string,
    grpcUrl: string,
    network: string,
    startHeight: number,
    endHeight: number,
    knownNullifiers: string,
  ): Promise<string>;

  /** Current chain tip — see {@link chainTip}. Resolves with a decimal string. */
  chainTip(grpcUrl: string): Promise<string>;
}

/** One decrypted note belonging to this account. */
export type ZcashNote = {
  amount: number;
  pool: "sapling" | "orchard" | "ironwood";
  transfer_type: "incoming" | "outgoing" | "internal";
  memo: string;
  nullifier: string | null;
  position: number | null;
  is_spent: boolean;
};

/** A matched, fully-decrypted shielded transaction. */
export type ZcashShieldedTransaction = {
  txid: string;
  block_height: number;
  block_time: number;
  fee_zatoshis: number;
  /** Raw transaction bytes, hex. Large — do not persist. */
  hex: string;
  sapling_notes: ZcashNote[];
  orchard_notes: ZcashNote[];
  ironwood_notes: ZcashNote[];
};

/** What a scan reports back. Mirrors `SyncResult` in `zcash-sync`. */
export type ZcashSyncResult = {
  transactions: ZcashShieldedTransaction[];
  blocks_scanned: number;
  elapsed_ms: number;
  bytes_downloaded: number;
  trial_decrypt_ms: number;
  get_transaction_ms: number;
  full_decrypt_ms: number;
  stream_wait_ms: number;
  spent_known_nullifiers: string[];
};

/** What the engine reports back from a threading probe. */
export type ZcashThreadProbe = {
  threads: number;
  iterations: number;
  serial_ms: number;
  parallel_ms: number;
  speedup: number;
};

const nativeModule: ZcashFfiNativeModule | null = NativeModules.ZcashFfiModule ?? null;

/**
 * Whether the native module is registered at all.
 *
 * `false` means a call cannot succeed. `true` does **not** mean it will: on
 * Android the module registers before the library is loaded (see the note at
 * the top of this file), so a build without the engine still answers `true`
 * here and rejects with `ZCASH_FFI_UNAVAILABLE` on the first call.
 */
export function isZcashFfiAvailable(): boolean {
  return nativeModule !== null;
}

function isKnownCode(code: unknown): code is ZcashFfiErrorCode {
  return ZCASH_FFI_ERROR_CODES.includes(code as ZcashFfiErrorCode);
}

/**
 * Derives the Orchard-only unified address from an encoded UFVK.
 *
 * This is the address the device shows for verification -- **not** the
 * multi-receiver unified address.
 *
 * Neither the argument nor a failure is ever logged here: a UFVK exposes an
 * account's entire transaction history, so it must not reach a log, a crash
 * report or an analytics payload. The Rust layer holds the same line, keeping
 * key material out of its error strings.
 */
export async function deriveOrchardAddress(ufvk: string): Promise<string> {
  if (!nativeModule) {
    throw new ZcashFfiError(
      "ZCASH_FFI_UNAVAILABLE",
      "The Zcash native library is not linked into this build",
    );
  }

  try {
    return await nativeModule.deriveOrchardAddress(ufvk);
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    const message = error instanceof Error ? error.message : "Zcash FFI call failed";
    throw new ZcashFfiError(isKnownCode(code) ? code : "ZCASH_FFI_UNKNOWN", message);
  }
}
/**
 * Diagnostic: measure whether the Rust layer gets real parallelism here.
 *
 * Answers a question blocking the mobile shielded-sync decision — threading is
 * assumed to work on iOS and Android, but nothing shipped has ever spawned a
 * thread from Rust. Runs real elliptic-curve work serially, then through
 * Rayon, and reports both.
 *
 * **On the Simulator this measures the Mac's cores, not a phone's.** A figure
 * from a physical device is the one that counts.
 */
export async function runThreadProbe(ufvk: string, iterations = 200): Promise<ZcashThreadProbe> {
  if (!nativeModule) {
    throw new ZcashFfiError(
      "ZCASH_FFI_UNAVAILABLE",
      "The Zcash native library is not linked into this build",
    );
  }

  try {
    return JSON.parse(await nativeModule.threadProbe(ufvk, iterations)) as ZcashThreadProbe;
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    const message = error instanceof Error ? error.message : "Zcash FFI probe failed";
    throw new ZcashFfiError(isKnownCode(code) ? code : "ZCASH_FFI_UNKNOWN", message);
  }
}

/**
 * Scans `startHeight..=endHeight` for notes belonging to this viewing key.
 *
 * **Blocking on the native side, and all-or-nothing.** The promise settles
 * once, when the whole range is done: no progress, no cancellation, and a
 * failure at the last block discards everything scanned before it. The JS
 * thread stays free throughout — it is a native worker thread that blocks —
 * so the UI is unaffected, but keep the range small. A full history needs the
 * streaming design, not this call.
 *
 * As everywhere in this module, the UFVK must never reach a log.
 */
export async function syncRange(
  ufvk: string,
  grpcUrl: string,
  network: "mainnet" | "testnet",
  startHeight: number,
  endHeight: number,
  knownNullifiers: readonly string[] = [],
): Promise<ZcashSyncResult> {
  if (!nativeModule) {
    throw new ZcashFfiError(
      "ZCASH_FFI_UNAVAILABLE",
      "The Zcash native library is not linked into this build",
    );
  }

  try {
    const json = await nativeModule.syncRange(
      ufvk,
      grpcUrl,
      network,
      startHeight,
      endHeight,
      // Newline-separated across the C ABI: nullifiers are hex, so there is
      // nothing to escape and nothing to parse.
      knownNullifiers.join("\n"),
    );
    return JSON.parse(json) as ZcashSyncResult;
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    const message = error instanceof Error ? error.message : "Zcash FFI sync failed";
    throw new ZcashFfiError(isKnownCode(code) ? code : "ZCASH_FFI_UNKNOWN", message);
  }
}

/**
 * Current chain tip height.
 *
 * The chunked scan needs it to know where to stop, and only the engine can
 * ask — there is no gRPC client on the JavaScript side.
 */
export async function chainTip(grpcUrl: string): Promise<number> {
  if (!nativeModule) {
    throw new ZcashFfiError(
      "ZCASH_FFI_UNAVAILABLE",
      "The Zcash native library is not linked into this build",
    );
  }

  try {
    return Number(await nativeModule.chainTip(grpcUrl));
  } catch (error) {
    const code = (error as { code?: unknown })?.code;
    const message = error instanceof Error ? error.message : "Zcash FFI chain tip failed";
    throw new ZcashFfiError(isKnownCode(code) ? code : "ZCASH_FFI_UNKNOWN", message);
  }
}
