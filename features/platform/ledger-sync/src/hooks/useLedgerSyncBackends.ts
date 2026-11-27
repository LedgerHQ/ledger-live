import { useMemo } from "react";
import { z } from "zod";
import { LedgerSyncBackendsMissingError } from "../errors";
import { useLedgerSyncDispatch } from "../internals/store";
import { LedgerSyncBackendsSchema, type LedgerSyncBackends } from "../logic/backends";

/**
 * The key ring and Cloud Sync backends of this session, from the app config the store was built
 * with. Throws `LedgerSyncBackendsMissingError` when its thunk `extraArgument` has no valid
 * `ledgerSyncBackendsExtra(...)`.
 *
 * @example
 * ```ts
 * const { keyRingApiBaseUrl, cloudSyncApiBaseUrl } = useLedgerSyncBackends();
 * ```
 */
export function useLedgerSyncBackends(): LedgerSyncBackends {
  const dispatch = useLedgerSyncDispatch();
  return useMemo(
    () => dispatch((_dispatch, _getState, extra: unknown) => ledgerSyncBackendsOf(extra)),
    [dispatch],
  );
}

const LedgerSyncBackendsExtraSchema = z.object({ ledgerSyncBackends: LedgerSyncBackendsSchema });

function ledgerSyncBackendsOf(extra: unknown): LedgerSyncBackends {
  const parsed = LedgerSyncBackendsExtraSchema.safeParse(extra);
  if (!parsed.success) throw new LedgerSyncBackendsMissingError({ cause: parsed.error });
  return parsed.data.ledgerSyncBackends;
}
