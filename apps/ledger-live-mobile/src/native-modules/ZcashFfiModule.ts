import { NativeModules } from "react-native";

// Bridge to the Zcash Rust engine's C ABI (`zcash-ffi-mobile` in
// LedgerHQ/ledger-zcash-utils), which the app links as an iOS XCFramework and
// as a per-ABI Android `.so`. The Node `.node` addon that desktop uses cannot
// load in a React Native bundle, so mobile reaches the same Rust code through
// this binding instead.
//
// The native module is absent when the app was built without those artifacts
// (see `scripts/sync-zcash-ffi.sh`), which is why every export here tolerates
// its absence instead of assuming a linked library.

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
}

const nativeModule: ZcashFfiNativeModule | null = NativeModules.ZcashFfiModule ?? null;

/** Whether this build links the native library. */
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
