import { z } from "zod";
import { flagWith } from "../../define";

/**
 * Gates the coin-side Datadog logs: `coin_module_call` (one per coin-module method call) and
 * `tx_broadcast` (one per broadcast outcome, every family and route). Off by default; a rollout
 * turns it on remotely, and turning it off is the kill switch.
 *
 * Each coin-module method belongs to a tier, defaulted in `@features/platform-coin-observability`
 * (`DEFAULT_METHOD_TIERS`):
 * - `transaction` (`craftTransaction`, `craftRawTransaction`, `combine`, `broadcast`): always sent;
 * - `preparation` (`craftTransactionData`, `estimateFees`, `validateIntent`, …), called on every
 *   edit of a transaction: successes sampled with `preparationSampleRate`;
 * - `sync` (reads, per account and sync cycle): successes sampled with `syncPathSampleRate`;
 * - `off`: nothing sent, failures included.
 * `methodTiers` moves a method to another tier without a release, e.g.
 * `{ "craftTransactionData": "off" }`. An entry with an unknown tier is ignored.
 *
 * A sample rate is the share of app sessions whose successes are sent, all of them or none per
 * session. Failures are sent from every session, except for an `off` method.
 * `includeSyncPath: false` turns off the `sync` tier, failures included, and keeps the other tiers
 * and `tx_broadcast`.
 * `maxFailuresPerKey` caps the failures sent per method, currency and error name within an hour,
 * so a node outage does not turn every client into a log storm.
 *
 * Datadog's own consent and flag (`lldDatadog` / `llmDatadog`, crash-reporting opt-in) still
 * apply on top of this one.
 */
export const coinObservability = flagWith(
  {
    includeSyncPath: z.boolean(),
    syncPathSampleRate: z.number().min(0).max(1),
    preparationSampleRate: z.number().min(0).max(1),
    maxFailuresPerKey: z.number().int().min(0),
    methodTiers: z
      .record(z.string(), z.enum(["transaction", "preparation", "sync", "off"]))
      .optional(),
  },
  {
    enabled: false,
    params: {
      includeSyncPath: true,
      syncPathSampleRate: 0.1,
      preparationSampleRate: 0.1,
      maxFailuresPerKey: 5,
      methodTiers: {},
    },
  },
);
