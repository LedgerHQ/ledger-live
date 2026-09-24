import { mock } from "bun:test";

/**
 * Shared, flag-gated module mocks for the `ledger-sync` command unit tests. `mock.module` is
 * process-global, so an ungated top-level mock would leak into every other test file (including the
 * in-process CLI tests) — see `commands/agent-intent/__test-helpers__/agent-intent-mocks.ts` for the
 * full rationale; this is the same pattern.
 */

type AnyFn = (...args: never[]) => unknown;

export type LedgerSyncMockOverrides = {
  /** Replaces `Session.read`; every other `Session` member stays real. */
  sessionRead?: () => Promise<unknown>;
  /** Replaces `withSessionLock` with a lock-free `fn()` call (no real file lock or state dir). */
  noopSessionLock?: boolean;
  keychain?: Partial<Record<(typeof KEYCHAIN_KEYS)[number], AnyFn>>;
  lkrpSdk?: Partial<Record<(typeof LKRP_SDK_KEYS)[number], AnyFn>>;
  cloudSync?: Partial<Record<(typeof CLOUD_SYNC_KEYS)[number], AnyFn>>;
  device?: Partial<Record<(typeof DEVICE_KEYS)[number], AnyFn>>;
  inputs?: Partial<Record<(typeof INPUTS_KEYS)[number], AnyFn>>;
};

const KEYCHAIN_KEYS = [
  "saveLedgerSyncMemberCredentials",
  "loadLedgerSyncMemberCredentials",
  "deleteLedgerSyncMemberCredentials",
  "hasLedgerSyncMemberCredentials",
  "ledgerSyncCredentialState",
] as const;
const LKRP_SDK_KEYS = ["createLkrpSdk"] as const;
const CLOUD_SYNC_KEYS = ["pullSyncedAccounts", "mergeSyncedAccounts"] as const;
const DEVICE_KEYS = ["withLkrpDeviceSession"] as const;
const INPUTS_KEYS = ["confirmTyped"] as const;

// Snapshot the genuine exports into PLAIN objects before any mock is installed: `mock.module` re-binds
// the live namespace to the mock, so a pass-through reading from the namespace would recurse forever.
const realSessionStore = { ...(await import("../../../session/session-store")) };
const realKeychain = { ...(await import("../../../ledger-sync/keychain")) } as Record<
  string,
  unknown
>;
const realLkrpSdk = { ...(await import("../../../key-ring/lkrp-sdk")) } as Record<string, unknown>;
const realCloudSync = { ...(await import("../../../ledger-sync/cloud-sync-accounts")) } as Record<
  string,
  unknown
>;

const realDevice = { ...(await import("../../../session/bridge-device-session")) } as Record<
  string,
  unknown
>;
const realInputs = { ...(await import("../../inputs")) } as Record<string, unknown>;

let active: LedgerSyncMockOverrides | null = null;

const gatedSession = new Proxy(realSessionStore.Session, {
  get(target, prop, receiver) {
    if (prop === "read" && active?.sessionRead) return active.sessionRead;
    return Reflect.get(target, prop, receiver);
  },
});

const gatedWithSessionLock: typeof realSessionStore.withSessionLock = async fn =>
  active?.noopSessionLock ? fn() : realSessionStore.withSessionLock(fn);

function gatedMembers(
  real: Record<string, unknown>,
  keys: readonly string[],
  pick: (key: string) => AnyFn | undefined,
): Record<string, unknown> {
  return Object.fromEntries(
    keys.map(key => [key, (...args: never[]) => (pick(key) ?? (real[key] as AnyFn))(...args)]),
  );
}

function installMocks(): void {
  mock.module("../../../session/session-store", () => ({
    ...realSessionStore,
    Session: gatedSession,
    withSessionLock: gatedWithSessionLock,
  }));
  mock.module("../../../ledger-sync/keychain", () => ({
    ...realKeychain,
    ...gatedMembers(
      realKeychain,
      KEYCHAIN_KEYS,
      key => active?.keychain?.[key as (typeof KEYCHAIN_KEYS)[number]],
    ),
  }));
  mock.module("../../../key-ring/lkrp-sdk", () => ({
    ...realLkrpSdk,
    ...gatedMembers(
      realLkrpSdk,
      LKRP_SDK_KEYS,
      key => active?.lkrpSdk?.[key as (typeof LKRP_SDK_KEYS)[number]],
    ),
  }));
  mock.module("../../../ledger-sync/cloud-sync-accounts", () => ({
    ...realCloudSync,
    ...gatedMembers(
      realCloudSync,
      CLOUD_SYNC_KEYS,
      key => active?.cloudSync?.[key as (typeof CLOUD_SYNC_KEYS)[number]],
    ),
  }));
  mock.module("../../../session/bridge-device-session", () => ({
    ...realDevice,
    ...gatedMembers(
      realDevice,
      DEVICE_KEYS,
      key => active?.device?.[key as (typeof DEVICE_KEYS)[number]],
    ),
  }));
  mock.module("../../inputs", () => ({
    ...realInputs,
    ...gatedMembers(
      realInputs,
      INPUTS_KEYS,
      key => active?.inputs?.[key as (typeof INPUTS_KEYS)[number]],
    ),
  }));
}

// Installed at load (collection phase) and inactive by default, so every other test sees the real modules.
installMocks();

/** Scope these fakes to the calling test file. Re-installs defensively in case a sibling file restored mocks. */
export function activateLedgerSyncMocks(overrides: LedgerSyncMockOverrides): void {
  active = overrides;
  installMocks();
}

export function deactivateLedgerSyncMocks(): void {
  active = null;
}
