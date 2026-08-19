import { z } from "zod";

/**
 * Quarantine entry schema — PRD §5.2.
 *
 * Each `quarantine/*.yaml` file contains exactly one entry. The schema is the
 * single source of truth for the on-disk format and is validated by `load.ts`.
 */

/** ISO calendar date, e.g. "2026-12-31". */
const isoDate = z
  .string()
  .regex(/^\d{4}-\d{2}-\d{2}$/, "expiry must be an ISO date (YYYY-MM-DD)")
  .refine(value => !Number.isNaN(Date.parse(value)), "expiry is not a valid date");

export const QuarantineMode = z.enum(["skip", "ignore"]);
export type QuarantineMode = z.infer<typeof QuarantineMode>;

const FilterSchema = z
  .object({
    /** Repo-relative path or glob, matched against the test file path. */
    file: z.string().min(1),
    /** The resolved (final, interpolated) full test title. */
    title: z.string().min(1).optional(),
    /** A regex alternative to `title`, matched against the resolved title. */
    titlePattern: z.string().min(1).optional(),
  })
  .strict()
  .superRefine((filter, ctx) => {
    if (filter.title !== undefined && filter.titlePattern !== undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "filter.title and filter.titlePattern are mutually exclusive",
        path: ["title"],
      });
    }
    if (filter.titlePattern !== undefined) {
      try {
        // Validation only — we construct the RegExp to confirm it compiles; it is
        // never matched against user input here. The compiled instance is stored on
        // LoadedEntry.titleRegex by load.ts and reused from there.
        // eslint-disable-next-line no-new
        new RegExp(filter.titlePattern);
      } catch (error) {
        ctx.addIssue({
          code: z.ZodIssueCode.custom,
          message: `filter.titlePattern is not a valid regex: ${(error as Error).message}`,
          path: ["titlePattern"],
        });
      }
    }
  });

export const QuarantineEntrySchema = z
  .object({
    /** "skip" (default) = filtered out before launch; "ignore" = run, gate exit code. PRD §6. */
    mode: QuarantineMode.default("skip"),
    /** Human explanation, logged by the wrapper when the entry is applied. */
    reason: z.string().min(1),
    /** GitHub team/handle; also the `codeowner` on emitted flake events. */
    owner: z.string().min(1),
    /** ISO date; the entry stops applying after this date. PRD §9. */
    expiry: isoDate,
    /** Optional tracking ticket. */
    jira: z.string().min(1).optional(),
    filter: FilterSchema,
  })
  .strict();

export type QuarantineEntry = z.infer<typeof QuarantineEntrySchema>;

/** An entry plus provenance (its source file), used in logs and diagnostics. */
export interface LoadedEntry {
  entry: QuarantineEntry;
  /** Absolute path of the YAML file the entry was loaded from. */
  sourcePath: string;
  /** `sourcePath` relative to the repo root, for human-readable logs. */
  sourceRelative: string;
  /**
   * Pre-compiled form of `entry.filter.titlePattern` (set by `load.ts` when the
   * field is present). Reusing this instance avoids reconstructing the RegExp on
   * every match call and keeps the non-literal regex construction out of the hot
   * path.
   */
  titleRegex?: RegExp;
}

/**
 * A normalized per-attempt test outcome, produced by every output parser and
 * the Detox reporter. The flake reducer and exit-gate consume this shape.
 */
export interface TestRecord {
  /** Repo-relative spec/test file path. */
  file: string;
  /** Resolved full test title. */
  title: string;
  /** Attempt index, 0-based (0 = first run). */
  attempt: number;
  /** Wall-clock ms; Detox-only ordering tiebreaker (its reruns all carry attempt 0). */
  recordedAt?: number;
  /** Final outcome of this attempt. */
  status: "passed" | "failed" | "skipped";
  /**
   * Whether the runner considered this an *unexpected* failure. Playwright
   * distinguishes expected/unexpected; for Jest/Detox a `failed` status is
   * always unexpected.
   */
  unexpected?: boolean;
  errorMessage?: string;
  stack?: string;
}
