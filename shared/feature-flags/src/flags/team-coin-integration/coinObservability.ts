import { z } from "zod";
import { flagWith } from "../../define";

/**
 * Gates the coin-side Datadog logs: `coin_module_call` (one per coin-module method call) and
 * `tx_broadcast` (one per broadcast outcome, every family and route). Off by default; a rollout
 * turns it on remotely, and turning it off is the kill switch.
 *
 * `includeSyncPath: false` turns off `coin_module_call` for the sync-path (read) methods, failures
 * included, and keeps the transaction-path calls and `tx_broadcast`. `syncPathSampleRate` is the
 * share of app sessions whose sync-path successes are sent, all of them or none per session
 * (failures and transaction-path calls are always sent).
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
    maxFailuresPerKey: z.number().int().min(0),
  },
  {
    enabled: false,
    params: {
      includeSyncPath: true,
      syncPathSampleRate: 0.1,
      maxFailuresPerKey: 5,
    },
  },
);
