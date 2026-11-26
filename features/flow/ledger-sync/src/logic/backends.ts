import { z } from "zod";

/** The base URLs of the key ring and Cloud Sync backends this session talks to. */
export const LedgerSyncBackendsSchema = z.object({
  keyRingApiBaseUrl: z.url({ protocol: /^https?$/ }),
  cloudSyncApiBaseUrl: z.url({ protocol: /^https?$/ }),
});

/** The base URLs of the key ring and Cloud Sync backends this session talks to. */
export type LedgerSyncBackends = z.infer<typeof LedgerSyncBackendsSchema>;

/** This package's slice of the thunk `extraArgument`. */
export type LedgerSyncBackendsExtra = Readonly<{ ledgerSyncBackends: LedgerSyncBackends }>;

/**
 * Validates the backends of the app config and returns this package's slice of the thunk
 * `extraArgument`, which `useLedgerSyncBackends` reads.
 *
 * @example
 * ```ts
 * thunk: {
 *   extraArgument: {
 *     ...ledgerSyncBackendsExtra({
 *       keyRingApiBaseUrl: appConfig.trustchainApiBaseUrl,
 *       cloudSyncApiBaseUrl: appConfig.cloudSyncApiBaseUrl,
 *     }),
 *   },
 * },
 * ```
 */
export function ledgerSyncBackendsExtra(backends: LedgerSyncBackends): LedgerSyncBackendsExtra {
  return { ledgerSyncBackends: LedgerSyncBackendsSchema.parse(backends) };
}
