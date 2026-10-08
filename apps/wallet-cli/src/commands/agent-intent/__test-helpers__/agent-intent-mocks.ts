import { mock } from "bun:test";
import { createGatedModuleMock } from "../../../testing/gated-module-mock";

/**
 * Shared, flag-gated module mocks for the `agent-intent` command unit tests. The in-process CLI tests
 * run in the same process and would otherwise read a fake session with no `accounts`, so each
 * agent-intent test file activates its fakes in `beforeAll` and releases them in `afterAll`.
 */

type AnyFn = (...args: never[]) => unknown;

export type AgentIntentMockOverrides = {
  /** Replaces `Session.read`; every other `Session` member stays real. */
  sessionRead?: () => Promise<unknown>;
  /** Replaces `withSessionLock` with a lock-free `fn()` call (no real file lock or state dir). */
  noopSessionLock?: boolean;
  sdk?: Partial<Record<(typeof SDK_KEYS)[number], AnyFn>>;
  keychain?: Partial<Record<(typeof KEYCHAIN_KEYS)[number], AnyFn>>;
  completionAuth?: Partial<Record<(typeof COMPLETION_AUTH_KEYS)[number], AnyFn>>;
  lkrpSdk?: Partial<Record<(typeof LKRP_SDK_KEYS)[number], AnyFn>>;
  cloudSync?: Partial<Record<(typeof CLOUD_SYNC_KEYS)[number], AnyFn>>;
  tokenLookup?: Partial<Record<(typeof TOKEN_LOOKUP_KEYS)[number], AnyFn>>;
};

const SDK_KEYS = [
  "createSoftwareAgentIdentity",
  "createAgentEnrollmentRequest",
  "createAgentEnrollmentUrl",
  "createAgentEnrollmentChannelHost",
  "createAgentRecoveryRequest",
  "createAgentRecoveryUrl",
  "createAgentIntentClient",
] as const;

const COMPLETION_AUTH_KEYS = [
  "authenticateEnrollmentCompletion",
  "authenticateRecoveryCompletion",
] as const;

const KEYCHAIN_KEYS = [
  "hasAgentIntentSecretKey",
  "saveAgentIntentSecretKey",
  "loadAgentIntentSecretKey",
  "deleteAgentIntentSecretKey",
] as const;

const LKRP_SDK_KEYS = ["createAgentLedgerSyncSdk"] as const;

const CLOUD_SYNC_KEYS = ["pullSyncedAccounts", "mergeSyncedAccounts"] as const;

const TOKEN_LOOKUP_KEYS = ["findEthereumToken"] as const;

// Snapshot the genuine exports into PLAIN objects before any mock is installed: `mock.module` re-binds
// the live namespace to the mock, so a pass-through reading from the namespace would recurse forever.
const realSessionStore = { ...(await import("../../../session/session-store")) };
/** The genuine SDK, for tests that wrap a real SDK function (e.g. a real client over a fake fetch). */
export const realAgentIntentSdk = { ...(await import("@ledgerhq/agent-intent-sdk")) };

let active: AgentIntentMockOverrides | null = null;

const gatedSession = new Proxy(realSessionStore.Session, {
  get(target, prop, receiver) {
    if (prop === "read" && active?.sessionRead) return active.sessionRead;
    return Reflect.get(target, prop, receiver);
  },
});

const gatedWithSessionLock: typeof realSessionStore.withSessionLock = async fn =>
  active?.noopSessionLock ? fn() : realSessionStore.withSessionLock(fn);

function installSessionMock(): void {
  mock.module("../../../session/session-store", () => ({
    ...realSessionStore,
    Session: gatedSession,
    withSessionLock: gatedWithSessionLock,
  }));
}

const sdkMock = await createGatedModuleMock("@ledgerhq/agent-intent-sdk", SDK_KEYS);
const keychainMock = await createGatedModuleMock(
  require.resolve("../../../key-ring/agent-intent-keychain"),
  KEYCHAIN_KEYS,
);
const completionAuthMock = await createGatedModuleMock(
  require.resolve("../../../agent-intent/completion-auth"),
  COMPLETION_AUTH_KEYS,
);
const lkrpSdkMock = await createGatedModuleMock(
  require.resolve("../../../key-ring/lkrp-sdk"),
  LKRP_SDK_KEYS,
);
const cloudSyncMock = await createGatedModuleMock(
  require.resolve("../../../ledger-sync/cloud-sync-accounts"),
  CLOUD_SYNC_KEYS,
);
const tokenLookupMock = await createGatedModuleMock(
  require.resolve("../../../agent-intent/token-lookup"),
  TOKEN_LOOKUP_KEYS,
);

// Installed at load (collection phase) and inactive by default, so every other test sees the real module.
installSessionMock();

/** Scope these fakes to the calling test file. */
export function activateAgentIntentMocks(overrides: AgentIntentMockOverrides): void {
  active = overrides;
  installSessionMock();
  sdkMock.activate(overrides.sdk ?? {});
  keychainMock.activate(overrides.keychain ?? {});
  completionAuthMock.activate(overrides.completionAuth ?? {});
  lkrpSdkMock.activate(overrides.lkrpSdk ?? {});
  cloudSyncMock.activate(overrides.cloudSync ?? {});
  tokenLookupMock.activate(overrides.tokenLookup ?? {});
}

export function deactivateAgentIntentMocks(): void {
  active = null;
  for (const gated of [
    sdkMock,
    keychainMock,
    completionAuthMock,
    lkrpSdkMock,
    cloudSyncMock,
    tokenLookupMock,
  ]) {
    gated.deactivate();
  }
}
