import { z } from "zod";
import { log } from "@ledgerhq/logs";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";
import type { ConfigSchema } from "@ledgerhq/live-config/LiveConfig";

export type OperationHistoryBoundEntry = {
  maxOperations?: number;
  pageSize?: number;
};

export type OperationHistoryBoundConfig = {
  maxOperations?: number;
  pageSize?: number;
  networks: Record<string, OperationHistoryBoundEntry>;
};

export type OperationHistoryBound = {
  /** `undefined` means unbounded: the walk and the store never truncate. */
  maxOperations: number | undefined;
  /**
   * The per-request page size for the paginated `listOperations` walk. Distinct from
   * `maxOperations`: this bounds one request, `maxOperations` bounds the whole walk. Always
   * resolved (defaulting to `DEFAULT_PAGE_SIZE`), but only meaningful -- i.e. only turned into a
   * `limit` at the call site -- when `maxOperations` is set; when unbounded, no page size is
   * ever sent, and this value is unused.
   */
  pageSize: number;
};

// A bound is meaningful only as a positive operation count; anything else (zero, negative,
// a non-number) degrades to unbounded rather than to an accidental truncation.
const MaxOperationsSchema = z.number().int().positive().optional().catch(undefined);

// Same shape of validation as above, but a page size never degrades to "no limit" -- an absent or
// hostile value falls back to `DEFAULT_PAGE_SIZE` instead, since sending no limit at all is exactly
// the legacy exhaustive-fetch behaviour this bound exists to avoid.
const PageSizeSchema = z.number().int().positive().optional().catch(undefined);

const OperationHistoryBoundEntrySchema = z
  .object({
    maxOperations: MaxOperationsSchema,
    pageSize: PageSizeSchema,
  })
  .catch({ maxOperations: undefined, pageSize: undefined });

const OperationHistoryBoundConfigSchema = z
  .object({
    maxOperations: MaxOperationsSchema,
    pageSize: PageSizeSchema,
    networks: z.record(z.string(), OperationHistoryBoundEntrySchema).default({}),
  })
  .catch({ maxOperations: undefined, pageSize: undefined, networks: {} });

/**
 * The shipped default is a **safety ceiling**, not a retention policy.
 *
 * Those are two different things and only the second is Product's. How much history a user should
 * see is a product decision, and this file does not make it: a lower `maxOperations` set remotely
 * overrides this value at any time. What is *not* negotiable is that the sync must not run out of
 * memory, and that is an engineering bound derived from measurement.
 *
 * Why a ceiling is required at all, rather than relying on `pageSize`: a page size bounds what one
 * request costs, but `paginateOperations` accumulates every page into one array before returning,
 * so nothing bounds the accumulation. Measured 2026-09-10 against the production EVM explorer on
 * 0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe, walking with pages of 100 and no ceiling, reading
 * live heap after a forced GC so the figures are retention and not collector lag:
 *
 *     page  25 ->     1 613 operations ->    72 MB
 *     page  50 ->     9 636 operations ->    89 MB
 *     page  75 ->   186 882 operations ->   392 MB
 *     page 125 ->   312 092 operations ->   632 MB
 *     page 150 ->   912 274 operations -> 1 817 MB
 *
 * That is linear, at roughly 2 KB of live heap per retained operation. This address carries about
 * 8.4 M operations, which extrapolates past 16 GB; the run died under a 2 GB heap. So an unbounded
 * walk cannot complete on an account of this shape however small the pages are.
 *
 * Why this figure: a full sync's peak is roughly 550 MB of constant cost (the exhaustive
 * token-discovery walk plus operation assembly) plus 2 KB per retained operation. End-to-end
 * measurements on the same address, same day, with pages of 100:
 *
 *     ceiling  50 000 -> 984 MB peak, completed
 *     ceiling 200 000 -> 962 MB peak, completed, 4 045 operations retained, 24 min
 *
 * 200 000 is the largest ceiling measured to complete, and it is the last point before the figures
 * leave measured ground. Above it the arithmetic predicts growth this walk never demonstrated.
 *
 * What it does *not* promise: 200 000 raw operations is not 200 000 rows a user sees. Operations
 * are counted as the module emits them, before filtering and before grouping by transaction; deep
 * in a spam-heavy history that ratio reached 49 to 1, so this ceiling retained about 4 045
 * transactions out of roughly 35 000 on the measured address. A retention policy expressed in
 * something a user recognises -- a number of transactions, or a time window -- is a separate
 * decision this ceiling neither makes nor prevents.
 */
export const DEFAULT_MAX_OPERATIONS = 200_000;

const DEFAULT_OPERATION_HISTORY_CONFIG: OperationHistoryBoundConfig = Object.freeze({
  maxOperations: DEFAULT_MAX_OPERATIONS,
  pageSize: undefined,
  networks: {},
});

export const operationHistoryConfig: ConfigSchema = {
  config_generic_operation_history: {
    type: "object",
    default: DEFAULT_OPERATION_HISTORY_CONFIG,
  },
};

/**
 * Applied whenever a bound is set (`maxOperations` defined) but no explicit `pageSize` is
 * configured, globally or per currency. Sized from measurements taken against the production EVM
 * explorer (2026-09-10, address 0xde0B295669a9FD93d5F28D9Ec85E40f4cb697BAe): pages of 500 records
 * reach roughly 117 MB each in the dense region of the history and drew HTTP 503/504 within about
 * 30 requests, while pages of 100 records (roughly 24 MB each) completed a 325-page walk with
 * 325x HTTP 200 and zero errors. 100 is the order of magnitude that stays inside both the
 * peak-memory budget and what the explorer tolerates; an absent or hostile configured value must
 * degrade to this constant, never to something larger.
 */
export const DEFAULT_PAGE_SIZE = 100;

/**
 * Resolved when the remote config is unavailable, malformed, or hostile. It carries the safety
 * ceiling rather than no ceiling: a missing config must not reopen the out-of-memory crash the
 * ceiling exists to prevent. Only a remote payload that parses can lower or lift it.
 */
const FALLBACK: OperationHistoryBound = Object.freeze({
  maxOperations: DEFAULT_MAX_OPERATIONS,
  pageSize: DEFAULT_PAGE_SIZE,
});

let warnedConfigMissing = false;

/**
 * Resolves the operation-history bound for one currency (`currency.id`, e.g. "ethereum",
 * "polygon", "stellar" -- the same key space `a4Config`'s per-chain record uses, and the one
 * already in scope in `genericGetAccountShape` via `currency.id`). Deliberately *not* keyed by
 * the coin-framework family (`"evm"`, `"stellar"`, ...): a remote payload keyed by family would
 * never match a per-currency entry written the way every other config in this framework is
 * written, silently falling back to the global value with no error and no log -- the one failure
 * mode this key space exists to remove. Page sizes and per-page costs differ by an order of
 * magnitude across chains, so the bound is looked up per currency rather than shared; the global
 * `maxOperations` still applies to any currency absent from `networks`, so a family-wide bound
 * stays expressible by setting the global. Every failure path -- LiveConfig unavailable, a
 * malformed payload, or a hostile per-currency value -- resolves to unbounded, never to an
 * accidental bound.
 */
export function resolveOperationHistoryBound(currencyId: string): OperationHistoryBound {
  try {
    const raw = LiveConfig.getValueByKey("config_generic_operation_history");

    const parsed = OperationHistoryBoundConfigSchema.safeParse(raw);
    if (!parsed.success) return FALLBACK;

    const { maxOperations: globalMax, pageSize: globalPageSize, networks } = parsed.data;
    const entry = networks[currencyId];
    const maxOperations = entry?.maxOperations ?? globalMax ?? DEFAULT_MAX_OPERATIONS;
    const pageSize = entry?.pageSize ?? globalPageSize ?? DEFAULT_PAGE_SIZE;

    return { maxOperations, pageSize };
  } catch {
    if (warnedConfigMissing) return FALLBACK;
    warnedConfigMissing = true;
    log(
      "generic-coin-framework",
      "config_generic_operation_history not set in LiveConfig - falling back to the default operation history ceiling",
    );
    return FALLBACK;
  }
}
