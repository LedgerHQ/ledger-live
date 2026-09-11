import { BigNumber } from "bignumber.js";
import type { ZcashPrivateInfo } from "./network/types";

export const ZCASH_LOG_TYPE = "zcash";
export const ZCASH_GRPC_URL_TESTNET = "https://testnet.zec.rocks";
export const ZCASH_GRPC_URL_MAINNET = "https://zec-indexer.coin.ledger-test.com";

// ── Zaino gRPC endpoint resolution ─────────────────────────────────────────
//
// The shielded sync path (bridge/sync.ts) and the shielded send path
// (bridge/signOperation.ts) MUST target the same endpoint and network.
// `setZainoGrpcUrl` lets callers override the default mainnet endpoint (e.g.
// point at testnet or a local node). Both paths resolve through
// `getZainoEndpoint()` so an override can never end up applied to sync but
// silently ignored when building/broadcasting a send.

export type ZcashNetwork = "mainnet" | "testnet";

let zainoGrpcUrlOverride: string | null = null;
let zainoNetworkOverride: ZcashNetwork | null = null;

const inferZainoNetwork = (url: string): ZcashNetwork =>
  url === ZCASH_GRPC_URL_TESTNET || /testnet/i.test(url) ? "testnet" : "mainnet";

/**
 * Override the Zaino gRPC URL used for shielded sync and shielded sends.
 * Pass `null` to reset to the default mainnet endpoint. When `network` is
 * omitted it is inferred from the URL (the testnet endpoint → "testnet",
 * anything else → "mainnet"); pass it explicitly for custom endpoints whose
 * network can't be inferred from the hostname.
 */
export const setZainoGrpcUrl = (url: string | null, network?: ZcashNetwork): void => {
  zainoGrpcUrlOverride = url;
  // A null URL resets to the mainnet default, so any network override (whether
  // passed here or set by a previous call) would leave the URL and network
  // inconsistent. Only keep a network override when a URL override is set.
  zainoNetworkOverride = url === null ? null : (network ?? null);
};

/** Effective Zaino gRPC URL (override if set, otherwise the mainnet default). */
export const getZainoGrpcUrl = (): string => zainoGrpcUrlOverride ?? ZCASH_GRPC_URL_MAINNET;

/** Effective network, kept consistent with {@link getZainoGrpcUrl}. */
export const getZainoNetwork = (): ZcashNetwork =>
  zainoNetworkOverride ?? inferZainoNetwork(getZainoGrpcUrl());

/** Effective endpoint (URL + network) shared by shielded sync and sends. */
export const getZainoEndpoint = (): { grpcUrl: string; network: ZcashNetwork } => ({
  grpcUrl: getZainoGrpcUrl(),
  network: getZainoNetwork(),
});

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
