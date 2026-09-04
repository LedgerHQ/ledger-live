import { ledgerSyncEnvironment } from "@ledgerhq/live-e2e-shared/ledgerSync/environment";

import type { PartialFeatures } from "@shared/feature-flags";

/**
 * Every suite that boots into a pre-seeded trustchain needs this flag on: the app reads the
 * environment from it to build its trustchain SDK, and Ledger Sync stays unavailable without it.
 */
export const LEDGER_SYNC_FEATURE_FLAGS: PartialFeatures = {
  llmWalletSync: {
    enabled: true,
    params: {
      environment: ledgerSyncEnvironment,
      watchConfig: {
        pollingInterval: 2_000,
        initialTimeout: 500,
      },
      learnMoreLink: "",
    },
  },
  llmLedgerSyncEntryPoints: { enabled: true },
};

/**
 * `lwmLedgerSyncOptimisation` swaps the activation screen for the one that routes through
 * choose-sync-method, so the suites that drive the activation UI have to opt into it explicitly.
 */
export const LEDGER_SYNC_ACTIVATION_FEATURE_FLAGS: PartialFeatures = {
  ...LEDGER_SYNC_FEATURE_FLAGS,
  // Every param spelled out to match the desktop suite: the override replaces `params` wholesale
  // rather than merging, so anything left out reads as off.
  llmLedgerSyncEntryPoints: {
    enabled: true,
    params: {
      manager: true,
      accounts: true,
      settings: true,
      onboarding: true,
      postOnboarding: true,
      sendFlow: false,
    },
  },
  lwmLedgerSyncOptimisation: { enabled: true },
};

/**
 * The app builds its trustchain SDK on first render and keeps it in a module singleton, so the
 * environment it boots with is the only one it will ever use — an override sent to a running app
 * moves the flag but not the SDK. Pointing the CLI elsewhere would leave the two on different
 * backends and surface as an empty trustchain rather than an error, so refuse it up front.
 */
function assertSupportedEnvironment() {
  if (ledgerSyncEnvironment !== "STAGING") {
    throw new Error(
      `Ledger Sync: mobile can only run against STAGING, got ${ledgerSyncEnvironment}. ` +
        "The app pins its trustchain SDK at boot, so LEDGER_SYNC_ENVIRONMENT cannot move it.",
    );
  }
}

/**
 * A seed per run, so every suite builds its trustchain from scratch instead of clearing whatever
 * the previous run left on the backend, and so no test ever derives accounts from the shared seed.
 */
export function setupLedgerSyncSeed() {
  let previousSeed: string | undefined;
  beforeAll(() => {
    assertSupportedEnvironment();
    previousSeed = app.ledgerSync.useGeneratedSeed();
  });
  afterAll(() => {
    app.ledgerSync.restoreSeed(previousSeed);
  });
}

/**
 * A generated seed makes the trustchain unreachable once the run ends, so this is what keeps the
 * backend from accumulating orphans. `app.init` never releases its Speculos either, so the device
 * has to be freed here or instances pile up until the file-level teardown.
 */
export function cleanupLedgerSyncAfterAll() {
  afterAll(async () => {
    await app.ledgerSync.destroyTrustchain();
    await app.common.removeSpeculos();
  });
}
