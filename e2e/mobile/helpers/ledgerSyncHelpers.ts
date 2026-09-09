import { ledgerSyncEnvironment } from "@ledgerhq/live-e2e-shared/ledgerSync/environment";
import { parseExtraFeatureFlags } from "@ledgerhq/live-e2e-shared/featureFlagsJsonUtils";
import { getFlags } from "@e2e/bridge/server";

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
 * `getFlags` resolves to an empty string when the bridge does not answer in time, and this is the
 * first round-trip of the run: on Android the app only reaches the server once `setup.ts` has
 * reverse-forwarded the port, so the client can still be in its connection backoff here. Retry
 * rather than read that silence as a wrong environment.
 */
async function readAppLedgerSyncEnvironment() {
  for (let attempt = 1; ; attempt++) {
    const rawFlags = await getFlags();
    if (rawFlags) {
      return parseExtraFeatureFlags<PartialFeatures>(rawFlags).llmWalletSync?.params?.environment;
    }
    if (attempt === 3) {
      throw new Error(
        "Ledger Sync: the app never answered `getFlags`, so its environment could not be checked. " +
          "The bridge is down — look for a launch or connection failure above.",
      );
    }
  }
}

/**
 * The environment reaches the app as the `ledger_sync_environment` launch arg, which the e2e bridge
 * turns into a flag override before the app tree mounts — the only window that works, since the app
 * builds its trustchain SDK on first render and keeps it in a module singleton.
 *
 * Call this *before* `app.init`: once a suite has pushed its own flags the read is circular, and it
 * is the value the app booted with that the SDK is holding. A launch arg that stopped arriving then
 * fails here, by name, rather than as the `400 Invalid value for: header Authorization` that a
 * trustchain and a cloud-sync on different backends produce.
 */
export async function verifyLedgerSyncEnvironment() {
  const appEnvironment = await readAppLedgerSyncEnvironment();

  if (appEnvironment !== ledgerSyncEnvironment) {
    throw new Error(
      `Ledger Sync: the app booted on ${appEnvironment}, the e2e CLI targets ${ledgerSyncEnvironment}. ` +
        "Both sides must share a backend: the trustchain mints the JWT cloud-sync validates.",
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
