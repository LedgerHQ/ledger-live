import { BigNumber } from "bignumber.js";
import type { ZcashCoinConfig } from "./config";
import type { ZcashPrivateInfo } from "./network/types";

export const ZCASH_LOG_TYPE = "zcash";
export const ZCASH_XPUB_VERSION = 0x0488b21e;

// ── Zaino gRPC endpoint resolution ─────────────────────────────────────────
//
// The shielded sync path (bridge/sync.ts) and the shielded send path
// (bridge/signOperation.ts) MUST target the same endpoint and network. Both
// derive it with `zainoEndpoint` from the coin config resolved through the
// bridge's context (`zaino.url`), so one config change reaches both.

export type ZcashNetwork = "mainnet" | "testnet";

export type ZainoEndpoint = { grpcUrl: string; network: ZcashNetwork };

const inferZainoNetwork = (url: string): ZcashNetwork =>
  /testnet/i.test(url) ? "testnet" : "mainnet";

/** Zaino endpoint (URL + network) shared by shielded sync and sends. */
export const zainoEndpoint = (config: ZcashCoinConfig): ZainoEndpoint => {
  const grpcUrl = config.zaino.url;
  return { grpcUrl, network: inferZainoNetwork(grpcUrl) };
};

/**
 * Strips anything a log line or an error-context extraction (which can reach
 * Datadog, unlike `@ledgerhq/logs`) shouldn't carry: the endpoint comes from a
 * remote coin config or points at a custom or local node, so nothing guarantees
 * it never carries userinfo or a token in its query string -- or in its path
 * (e.g. a `/token/<value>`-style gateway route). `origin` never includes
 * credentials by spec and is kept as the only diagnostic signal; the production
 * endpoint is a bare origin with no pathname today, so this drops nothing
 * currently in use.
 */
export const sanitizeEndpointForLog = (url: string): string => {
  try {
    return new URL(url).origin;
  } catch {
    return "[unparsable endpoint]";
  }
};

// Whether a Zcash account is served by this module or by coin-bitcoin's Zcash
// chain-adapter is decided upstream, by the `zcashShielded` feature flag the host
// app mirrors into live-common (`bridge/zcashRouting.ts`). This module never has
// to ask: it is only ever reached when the answer is yes.

// Ironwood (NU6.3) activation, not Orchard/NU5 -- Ledger's shielded balance
// covers the Ironwood pool only. The earliest block a Ledger-created
// shielded account can hold a note, and so the default birthday a scan starts from.
export const ZCASH_ACTIVATION_DATE = new Date("2026-07-28");
export const ZCASH_ACTIVATION_DATE_STRING = "2026-07-28";
// A freshly shielded note is scanned into the spendable (Ironwood) balance
// before it can actually be spent: it first needs to gain confirmations. Until
// the note's transaction has this many blocks mined on top of it, the spendable
// balance can trail the total.
export const ZCASH_SHIELDED_SPENDABILITY_DELAY_BLOCKS = 12;
export const ZCASH_MEMO_MAX_BYTES = 512;
/** @deprecated kept for backward compatibility */
export const ZCASH_OUTDATED_SYNC_INTERVAL_MINUTES = 2;
/** @deprecated kept for backward compatibility */
export const ZCASH_CHECK_OUTDATED_SYNC_INTERVAL = 5_000;
// Bounds how long the automatic (wallet-sync-driven) shielded leg may run before
// it is treated as hung and degraded to a "stopped" state for this tick. RxJS's
// `timeout()` on a plain number resets on every emission from the underlying
// scan, not once for the whole sync, so this is really a per-chunk budget: one
// server round-trip for one block range, not the full catch-up. A single
// chunk on an ordinary connection can legitimately take well over the
// previous 20s, especially for a new or far-behind account, exactly the case
// this task automates syncing for, so a tight value here falsely treats a
// slow-but-healthy chunk as hung. No chunk-processing time has actually been
// measured yet (this stays a planning-time default), but it must clearly
// exceed realistic single-chunk latency, not just "near-instant" typical
// latency. A resumable checkpoint (lastProcessedBlock) means the next tick
// picks up where this one left off, this only bounds one chunk's worst case.
export const ZCASH_AUTO_SYNC_TIMEOUT_MS = 120_000;
export const DEFAULT_ZCASH_PRIVATE_INFO: ZcashPrivateInfo = {
  orchardBalance: new BigNumber(0),
  saplingBalance: new BigNumber(0),
  ironwoodBalance: new BigNumber(0),
  ufvk: null,
  shieldedAddress: null,
  syncState: "disabled",
  progress: 0,
  estimatedTimeRemaining: { hours: 0, minutes: 0 },
  birthday: ZCASH_ACTIVATION_DATE_STRING,
  lastSyncTimestamp: null,
  lastProcessedBlock: null,
  transactions: [],
  lastSyncError: null,
};

/** Estimation recipient used by estimateMaxSpendable/fee-estimation flows. */
export const ZCASH_ESTIMATION_RECIPIENT = "t1XVXWCvpMgBvUaed4XDqWtgQgJSu1Ghz7F";

// ── Per-PCZT device ceilings ────────────────────────────────────────────────
//
// Values read from `app-zcash`'s `src/consts.rs` on `develop` (merge commit
// `22dc385`, the non-`capacity_probe` build, which is what ships): both
// bounds moved from 10 to 32 there. Re-check that file if these ever need
// revisiting -- the device's own bound is the source of truth, this is only
// a mirror of it.

/**
 * Transparent inputs one PCZT may spend, mirroring the device's
 * `MAX_PCZT_TRANSPARENT_INPUTS_NUMBER` (app-zcash, src/consts.rs).
 */
export const ZCASH_MAX_TRANSPARENT_INPUTS = 32;

/**
 * Ironwood spends one PCZT may carry, mirroring the device's
 * `MAX_PCZT_IRONWOOD_ACTIONS_NUMBER` (app-zcash, src/consts.rs). The shielded
 * send flow spends the Ironwood pool exclusively (types/bridge.ts), so this is
 * the only shielded-pool ceiling coin-zcash's own selection needs to mirror.
 */
export const ZCASH_MAX_IRONWOOD_ACTIONS = 32;
