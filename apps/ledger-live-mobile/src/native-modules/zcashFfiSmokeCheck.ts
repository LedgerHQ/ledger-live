import { log } from "@ledgerhq/logs";
import { deriveOrchardAddress, isZcashFfiAvailable, ZcashFfiError } from "./ZcashFfiModule";

// Proves the Zcash Rust engine actually runs inside the app: it derives a known
// address and compares it against the expected value. Nothing in the wallet
// consumes the engine on mobile yet, so without this the binding could be
// broken -- or absent -- and no one would notice.
//
// See the log with `VERBOSE=zcash-ffi` (or `VERBOSE=1`); the app's logger drops
// every other type.

export const ZCASH_FFI_LOG_TYPE = "zcash-ffi";

// Account 0 of the device-conformance vectors, taken verbatim from
// crates/zcash-ffi-mobile/src/lib.rs in LedgerHQ/ledger-zcash-utils, which
// sources them from app-zcash's tests/standalone/test_pubkey_cmd.py. They are
// public test data, not user key material -- so unlike a real UFVK they are
// safe to embed and to log.
const TEST_UFVK =
  "uview1zkk7f8hp2m5v09kq7h29vkgngwhhvgy2ey32cy5j0kp69g7ju2vqjvnue03u99z382rtkgvj3f8vtqdtxfxvgjytezgt39dqc0lyt2sj084jdq4md69snc3wxdcl8uah8sxw3rrt9pnxnfl3r4xnczapts7gr4l0cuell7dcjv36gkdcsl4axps827xt6fgmfl78zlhddec72tn2p0eqnpkuy7a08puhj97v0ahxuqlyzmyqtldqnc0p3696d9ww8x6mpd56mz6w32twryevru2rx34lf8dtqsp50gar";

const EXPECTED_ADDRESS =
  "u1u2h4ce7e2cn3z4nzur95muq2dl4da9x8h8kdp2l80gm9nl9raj8zzpx79ycjnfvar4v5exea5pqr5y9qsnlp0cdunwf9yjjx5c4q7ar9";

/**
 * Derives a known address through the native binding and logs the outcome.
 *
 * Resolves rather than throwing whatever happens: a failed probe must never
 * take down app startup.
 */
export async function logZcashFfiSmokeCheck(): Promise<void> {
  if (!isZcashFfiAvailable()) {
    log(ZCASH_FFI_LOG_TYPE, "engine not linked in this build (see scripts/sync-zcash-ffi.sh)");
    return;
  }

  try {
    const address = await deriveOrchardAddress(TEST_UFVK);

    if (address === EXPECTED_ADDRESS) {
      log(ZCASH_FFI_LOG_TYPE, "engine OK: derived address matches the device vector", { address });
    } else {
      // The binding works but the engine disagrees with the hardware -- a
      // wrong build, or a real regression in derivation.
      log(ZCASH_FFI_LOG_TYPE, "engine MISMATCH: derived address differs from the device vector", {
        address,
        expected: EXPECTED_ADDRESS,
      });
    }
  } catch (error) {
    log(ZCASH_FFI_LOG_TYPE, "engine call failed", {
      code: error instanceof ZcashFfiError ? error.code : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
