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

// Default ships unbounded: retention is a product decision, not the implementer's. Shipping any
// other default would be making that decision in code.
const DEFAULT_OPERATION_HISTORY_CONFIG: OperationHistoryBoundConfig = Object.freeze({
  maxOperations: undefined,
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

const UNBOUNDED: OperationHistoryBound = Object.freeze({
  maxOperations: undefined,
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
    if (!parsed.success) return UNBOUNDED;

    const { maxOperations: globalMax, pageSize: globalPageSize, networks } = parsed.data;
    const entry = networks[currencyId];
    const maxOperations = entry?.maxOperations ?? globalMax;
    const pageSize = entry?.pageSize ?? globalPageSize ?? DEFAULT_PAGE_SIZE;

    return { maxOperations, pageSize };
  } catch {
    if (warnedConfigMissing) return UNBOUNDED;
    warnedConfigMissing = true;
    log(
      "generic-coin-framework",
      "config_generic_operation_history not set in LiveConfig - operation history unbounded",
    );
    return UNBOUNDED;
  }
}
