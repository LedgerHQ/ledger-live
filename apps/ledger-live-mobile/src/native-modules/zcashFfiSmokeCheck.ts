import { log } from "@ledgerhq/logs";
import { createMMKV } from "react-native-mmkv";
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
const PROBE_BLOCKS = 1_000;
const MAINNET_INDEXER = "https://zec-indexer.coin.ledger-test.com";

// A store of its own, so a proof of concept cannot collide with app state.
// NOTE: MMKV is unencrypted at rest and, on iOS, is included in iCloud backup
// by default. Persist counts and identifiers only -- never memos, nullifiers,
// note randomness, or raw transaction bytes.
const syncStore = createMMKV({ id: "zcash-sync-poc" });

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
  const start = IRONWOOD_ACTIVATION;
  const end = start + PROBE_BLOCKS - 1;

  try {
    const result = await syncRange(TEST_UFVK, MAINNET_INDEXER, "mainnet", start, end);

    const notes = result.transactions.flatMap(tx => [
      ...tx.sapling_notes,
      ...tx.orchard_notes,
      ...tx.ironwood_notes,
    ]);

    log(
      ZCASH_FFI_LOG_TYPE,
      `sync OK: ${result.blocks_scanned} blocks in ${result.elapsed_ms}ms, ` +
        `${result.transactions.length} txs, ${notes.length} notes, ` +
        `${(result.bytes_downloaded / 1024).toFixed(0)} KiB downloaded ` +
        `(decrypt ${result.trial_decrypt_ms}ms, getTx ${result.get_transaction_ms}ms)`,
    );

    // A reduced record on purpose -- see the note on syncStore above.
    syncStore.set("cursor", String(end));
    syncStore.set(
      "summary",
      JSON.stringify({
        scannedTo: end,
        blocks: result.blocks_scanned,
        txs: result.transactions.length,
        notes: notes.length,
        bytesDownloaded: result.bytes_downloaded,
        elapsedMs: result.elapsed_ms,
      }),
    );
    syncStore.set(
      "txs",
      JSON.stringify(
        result.transactions.map(tx => ({
          txid: tx.txid,
          height: tx.block_height,
          time: tx.block_time,
          notes: [...tx.sapling_notes, ...tx.orchard_notes, ...tx.ironwood_notes].map(n => ({
            amount: n.amount,
            pool: n.pool,
            spent: n.is_spent,
          })),
        })),
      ),
    );

    log(ZCASH_FFI_LOG_TYPE, `persisted to MMKV, cursor now ${end}`);
  } catch (error) {
    log(ZCASH_FFI_LOG_TYPE, "sync failed", {
      code: error instanceof ZcashFfiError ? error.code : "unknown",
      message: error instanceof Error ? error.message : String(error),
    });
  }
}
