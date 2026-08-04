import { BigNumber } from "bignumber.js";
import type { ZcashPrivateInfo } from "./types";

export const ZCASH_LOG_TYPE = "zcash";
export const ZCASH_GRPC_URL_TESTNET = "https://testnet.zec.rocks";
export const ZCASH_GRPC_URL_MAINNET = "https://zec-indexer.coin.ledger-test.com";

// ── Zaino gRPC endpoint resolution ─────────────────────────────────────────
//
// The shielded sync path (sync.ts) and the shielded send path (index.ts) MUST
// target the same endpoint and network. `setZainoGrpcUrl` lets callers override
// the default mainnet endpoint (e.g. point at testnet or a local node). Both
// paths resolve through `getZainoEndpoint()` so an override can never end up
// applied to sync but silently ignored when building/broadcasting a send.

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

// ── Shielded routing feature flag ("zcashShielded") ─────────────────────────
//
// Which signing path a Zcash send takes is driven by the `zcashShielded` feature
// flag (see @ledgerhq/types-live `feature.ts`), NOT by the transfer type:
//   • flag ON  → every send (including Public→Public / transparent t→t) is built
//                and signed as a V5 PCZT through this adapter.
//   • flag OFF → every send falls back to the legacy transparent Bitcoin PSBT
//                path (the adapter returns `undefined` from each hook).
//
// A coin module cannot read React feature flags (`useFeature`) directly, so the
// host app mirrors the flag value into this module-level state — the same
// override pattern already used for the Zaino endpoint (`setZainoGrpcUrl`).
// Defaults to `false` so an unconfigured environment never routes through the
// in-development shielded path.
let zcashShieldedEnabled = false;

/** Mirror the `zcashShielded` feature flag into the coin module (see above). */
export const setZcashShieldedEnabled = (enabled: boolean): void => {
  zcashShieldedEnabled = enabled;
};

/** Whether shielded PCZT/V5 routing is enabled for Zcash sends. */
export const isZcashShieldedEnabled = (): boolean => zcashShieldedEnabled;
export const ZCASH_ACTIVATION_DATE = new Date("2022-05-31");
export const ZCASH_ACTIVATION_DATE_STRING = "2022-05-31";
export const ZCASH_OUTDATED_SYNC_INTERVAL_MINUTES = 2;
export const ZCASH_CHECK_OUTDATED_SYNC_INTERVAL = 5_000; // 5 seconds
export const DEFAULT_ZCASH_PRIVATE_INFO: ZcashPrivateInfo = {
  orchardBalance: new BigNumber(0),
  saplingBalance: new BigNumber(0),
  ironwoodBalance: new BigNumber(0),
  ufvk: null,
  syncState: "disabled",
  progress: 0,
  estimatedTimeRemaining: { hours: 0, minutes: 0 },
  birthday: ZCASH_ACTIVATION_DATE_STRING,
  lastSyncTimestamp: null,
  lastProcessedBlock: null,
  transactions: [],
};
