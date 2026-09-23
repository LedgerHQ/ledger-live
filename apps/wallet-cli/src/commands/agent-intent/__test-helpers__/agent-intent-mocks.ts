import { mock } from "bun:test";

/**
 * Shared, flag-gated module mocks for the `agent-intent` command unit tests.
 *
 * Bun evaluates every test file's top-level code in one collection phase before any test runs, and
 * `mock.module` is process-global, so a plain top-level `mock.module("session-store", ...)` in one of
 * these files replaces `Session` for EVERY other file too — including the in-process CLI tests under
 * `src/test/commands`, which then read a fake session with no `accounts` (see `test/helpers/cli-runner.ts`).
 * Instead this installs ONE mock per module whose overridden members delegate to the real
 * implementation unless an agent-intent test file has activated its fakes (`beforeAll`) and not yet
 * released them (`afterAll`). Same approach as `wallet/earn/__test-helpers__/earn-api-mock.ts`.
 */

type AnyFn = (...args: never[]) => unknown;

export type AgentIntentMockOverrides = {
  /** Replaces `Session.read`; every other `Session` member stays real. */
  sessionRead?: () => Promise<unknown>;
  /** Replaces `withSessionLock` with a lock-free `fn()` call (no real file lock or state dir). */
  noopSessionLock?: boolean;
  sdk?: Partial<Record<(typeof SDK_KEYS)[number], AnyFn>>;
  keychain?: Partial<Record<(typeof KEYCHAIN_KEYS)[number], AnyFn>>;
};

const SDK_KEYS = [
  "createSoftwareAgentIdentity",
  "createAgentEnrollmentRequest",
  "createAgentEnrollmentUrl",
  "parseAgentEnrollmentCompletion",
] as const;

const KEYCHAIN_KEYS = [
  "hasAgentIntentSecretKey",
  "saveAgentIntentSecretKey",
  "deleteAgentIntentSecretKey",
] as const;

// Snapshot the genuine exports into PLAIN objects before any mock is installed: `mock.module` re-binds
// the live namespace to the mock, so a pass-through reading from the namespace would recurse forever.
const realSessionStore = { ...(await import("../../../session/session-store")) };
const realSdk = { ...(await import("@ledgerhq/agent-intent-sdk")) } as Record<string, unknown>;
const realKeychain = { ...(await import("../../../key-ring/agent-intent-keychain")) } as Record<
  string,
  unknown
>;

let active: AgentIntentMockOverrides | null = null;

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
  mock.module("@ledgerhq/agent-intent-sdk", () => ({
    ...realSdk,
    ...gatedMembers(realSdk, SDK_KEYS, key => active?.sdk?.[key as (typeof SDK_KEYS)[number]]),
  }));
  mock.module("../../../key-ring/agent-intent-keychain", () => ({
    ...realKeychain,
    ...gatedMembers(
      realKeychain,
      KEYCHAIN_KEYS,
      key => active?.keychain?.[key as (typeof KEYCHAIN_KEYS)[number]],
    ),
  }));
}

// Installed at load (collection phase) and inactive by default, so every other test sees the real modules.
installMocks();

/** Scope these fakes to the calling test file. Re-installs defensively in case a sibling file restored mocks. */
export function activateAgentIntentMocks(overrides: AgentIntentMockOverrides): void {
  active = overrides;
  installMocks();
}

export function deactivateAgentIntentMocks(): void {
  active = null;
}
