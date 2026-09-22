import { log } from "@ledgerhq/logs";
import { runChunkedSync, readPersistedSync, accountIdForUfvk } from "./zcashChunkedSync";
import {
  deriveOrchardAddress,
  isZcashFfiAvailable,
  runThreadProbe,
  ZcashFfiError,
  syncRange,
} from "./ZcashFfiModule";

// Ironwood activation on mainnet. Nothing shielded exists before it for a
// Ledger account, so it is the earliest height worth scanning.
const IRONWOOD_ACTIVATION = 3_428_143;
const MAINNET_INDEXER = "https://zec-indexer.coin.ledger-test.com";

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

// By default the probe scans with the public test vector, which owns nothing —
// so the matched-transaction path (GetTransaction, full decryption) never runs.
// To exercise it, point the probe at a key that actually holds notes:
//
//   read -rs ZCASH_PROBE_UFVK && export ZCASH_PROBE_UFVK
//   ZCASH_PROBE_START=3428143 pnpm start --reset-cache
//
// `read -rs` keeps it out of shell history, and it is never logged below. Be
// aware that Babel inlines process.env at bundle time, so the value does reach
// Metro's on-disk transform cache — re-run with --reset-cache afterwards, and
// do not do this on a shared machine.
const PROBE_UFVK = process.env.ZCASH_PROBE_UFVK || TEST_UFVK;
const PROBE_START = Number(process.env.ZCASH_PROBE_START ?? IRONWOOD_ACTIVATION);

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
    return;
  }
  // Threading probe. Separate try/catch: a failure here says nothing about the
  // derivation above, which has already reported its own verdict.
  try {
    const probe = await runThreadProbe(TEST_UFVK);
    log(
      ZCASH_FFI_LOG_TYPE,
      `threads: ${probe.threads}, speedup ${probe.speedup}x ` +
        `(${probe.iterations} derivations: ${probe.serial_ms}ms serial -> ${probe.parallel_ms}ms parallel)`,
      probe,
    );
  } catch (error) {
    log(ZCASH_FFI_LOG_TYPE, "thread probe failed", {
      code: error instanceof ZcashFfiError ? error.code : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}

/**
 * Scans a small range and persists what it finds.
 *
 * Deliberately 1,000 blocks: enough to prove the engine streams, decrypts and
 * returns on a phone, small enough that the absence of progress reporting and
 * cancellation does not matter yet. Both of those become blocking problems at
 * full-history scale -- which is the point this probe exists to make concrete.
 */
export async function logZcashSyncProbe(): Promise<void> {
  log(
    ZCASH_FFI_LOG_TYPE,
    `sync probe: from ${PROBE_START}, key=${
      PROBE_UFVK === TEST_UFVK ? "public test vector" : "supplied via env"
    }`,
  );

  try {
    const accountId = accountIdForUfvk(PROBE_UFVK);

    const summary = await runChunkedSync({
      accountId,
      ufvk: PROBE_UFVK,
      grpcUrl: MAINNET_INDEXER,
      network: "mainnet",
      birthdayHeight: PROBE_START,
    });

    log(
      ZCASH_FFI_LOG_TYPE,
      `sync OK: ${summary.chunks} chunks, ${summary.blocksScanned} blocks in ` +
        `${summary.elapsedMs}ms, ${summary.transactions} txs, ${summary.notes} notes, ` +
        `${(summary.bytesDownloaded / 1024).toFixed(0)} KiB, cursor ${summary.cursor}`,
    );

    const persisted = readPersistedSync(accountId);
    log(
      ZCASH_FFI_LOG_TYPE,
      `MMKV holds ${persisted.transactions.length} txs, cursor ${persisted.cursor}, ` +
        `state ${persisted.state}`,
    );
  } catch (error) {
    log(ZCASH_FFI_LOG_TYPE, "sync failed", {
      code: error instanceof ZcashFfiError ? error.code : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
