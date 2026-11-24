import type { PartialFeatures } from "@shared/feature-flags";
import { getSpeculosAddress, type SpeculosDevice } from "@ledgerhq/live-e2e-shared/speculos";
import { CARD_SESSION_BOOTSTRAP_ENV } from "@ledgerhq/baanx-test-client";

type AppEnvOptions = {
  /** The test's `env` fixture, applied over the defaults. */
  env: Record<string, string>;
  mergedFeatureFlags: PartialFeatures;
  speculosDevice?: SpeculosDevice;
  testId: string;
};

/** The environment every E2E launch of the app gets. */
export function buildAppEnv(options: AppEnvOptions): Record<string, string> {
  const { env, mergedFeatureFlags, speculosDevice, testId } = options;
  const appEnv = Object.assign(
    {
      ...process.env,
      VERBOSE: true,
      MOCK: undefined,
      MOCK_COUNTERVALUES: undefined,
      HIDE_DEBUG_MOCK: true,
      CI: process.env.CI || undefined,
      PLAYWRIGHT_RUN: true,
      // Make CSV export filename unique per test (parallel-safe + traceable to a test id).
      PLAYWRIGHT_EXPORT_CSV_PATH: `./ledgerwallet-operations-${testId}.csv`,
      LEDGER_MIN_HEIGHT: 768,
      FEATURE_FLAGS: JSON.stringify(mergedFeatureFlags),
      MANAGER_DEV_MODE: true,
      SPECULOS_API_PORT: speculosDevice ? String(speculosDevice.port) : undefined,
      SPECULOS_ADDRESS: speculosDevice ? getSpeculosAddress() : undefined,
      SPECULOS_SESSION_TOKEN: speculosDevice ? process.env.SPECULOS_SESSION_TOKEN : undefined,
      DISABLE_TRANSACTION_BROADCAST: process.env.DISABLE_TRANSACTION_BROADCAST || "1",
      ...(process.env.DEV_TOOLS && { DEV_TOOLS_MODE: process.env.DEV_TOOLS_MODE || "detach" }),
    },
    env,
  );
  delete appEnv[CARD_SESSION_BOOTSTRAP_ENV];
  return appEnv;
}
