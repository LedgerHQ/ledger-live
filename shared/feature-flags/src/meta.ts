import { z } from "zod";

// Human- and tool-facing metadata for feature flags.
//
// Metadata lives in a Zod v4 registry (`flagMetaRegistry`) keyed by each flag's schema
// instance. It rides *alongside* the schema and never becomes part of the resolved flag
// value, so it has ZERO impact on flag resolution, Firebase mapping, e2e injection, or any
// registry-derived type (`Features`, `FeatureId`, `FEATURE_FLAGS_DEFAULTS`, …).
//
// This module imports only `zod` — never the flag registry — to preserve the deliberately
// acyclic `define.ts <-> schema.ts` dependency (see `data/schema.base.ts`).

/**
 * Lifecycle stage of a feature flag. Drives catalog grouping and stale detection.
 *
 * - `experiment` — short-lived A/B test or spike; expected to be removed after a decision.
 * - `rollout` — actively ramping toward 100%; should carry a `targetRemoval` once fully shipped.
 * - `permanent` — long-lived kill switch / configuration knob; not expected to be removed.
 * - `deprecated` — superseded; kept only for backward-compat and slated for removal.
 */
export type FlagStatus = "experiment" | "rollout" | "permanent" | "deprecated";

/** Human- and tool-facing metadata attached to a feature flag. */
export interface FlagMeta {
  /** One-line, human-readable explanation of what this flag gates. */
  description: string;
  /** Lifecycle stage — see {@link FlagStatus}. */
  status: FlagStatus;
  /**
   * Owning team. Optional: the `ff` tooling defaults it to the `team-*` folder the flag lives
   * in. Set only to override that filesystem-derived default.
   */
  owner?: string;
  /** Tracking ticket, e.g. `"LIVE-1234"`. */
  ticket?: string;
  /** ISO date (`YYYY-MM-DD`) the flag was introduced. */
  createdAt?: string;
  /**
   * When the flag should be gone: an ISO date (`YYYY-MM-DD`) or an app version (e.g. `"3.40.0"`).
   * `ff lint` errors once this is in the past.
   */
  targetRemoval?: string;
  /**
   * Ids of other flags this one implicitly depends on (e.g. `assetSection` depends on
   * `mainNavigation`). Typed as `string[]` — not `FeatureId[]` — to keep this module free of the
   * flag registry and thus acyclic; `ff lint` validates that the ids exist.
   */
  dependsOn?: string[];
  /**
   * Per-parameter documentation, keyed by param name. The primary way to explain rollout-wave
   * flags such as `lwdWallet40`/`lwmWallet40` (what `assetSection`, `q2Tour`, `pnl`, … flip).
   */
  paramsDoc?: Record<string, string>;
  /** Extra reference links (design doc, dashboard, RFC, …). */
  links?: { label: string; url: string }[];
}

/**
 * Registry mapping a flag's Zod schema to its {@link FlagMeta}. Populated by the `flag` /
 * `flagWith` / `flagWithRecord` helpers in `define.ts` when a `meta` argument is supplied,
 * and read by the `ff` tooling (catalog / lint / coverage).
 */
export const flagMetaRegistry = z.registry<FlagMeta>();

/** Returns the {@link FlagMeta} registered for a flag schema, or `undefined` if none was set. */
export const getFlagMeta = (schema: z.ZodType): FlagMeta | undefined => flagMetaRegistry.get(schema);
