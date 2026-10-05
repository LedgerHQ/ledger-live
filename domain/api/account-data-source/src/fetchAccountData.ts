import type { AccountId } from "@domain/entity-account";
import { computeAccountId } from "@domain/entity-account-alias";
import type { AccountDescriptor } from "@domain/entity-account-descriptor";
import type {
  AccountDataAction,
  AccountDataBinding,
  AccountDataQuery,
  AccountDatum,
} from "@domain/entity-account-data";
import type { AccountDataRouter } from "./router";

export const DEFAULT_ACCOUNT_DATA_MAX_AGE = 30_000;

/** This package's slice of the thunk `extraArgument`. */
export type AccountDataExtra = { accountData: AccountDataRouter };

export function getAccountDataRouter(extra: unknown): AccountDataRouter {
  const router = (extra as Partial<AccountDataExtra> | undefined)?.accountData;
  if (!router) throw new Error("No account data router in the thunk extraArgument (`accountData`)");
  return router;
}

export type FetchAccountDataOptions<K extends AccountDatum> = {
  /** A head read younger than this is not repeated. `0` always reads. */
  maxAge?: number;
  query?: AccountDataQuery<K>;
  /** Read the next page instead of the head. Only a paginated datum has one. */
  more?: boolean;
  signal?: AbortSignal;
};

export type FetchAccountDataBatchOptions<K extends AccountDatum> = Omit<
  FetchAccountDataOptions<K>,
  "more"
>;

type Dispatch = (action: AccountDataAction) => unknown;

// The head reads in flight, shared by single and batch reads. The store's pending flag alone is not
// trusted to say a read of this very process is under way.
const inflightHeadReads = new Set<string>();

const slotOf = (datum: AccountDatum, accountId: string) => `${datum}|${accountId}`;

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

/** Whether a head read of the account should go out: not already in flight, and not fresh enough. */
function isHeadReadDue<K extends AccountDatum, S>(
  binding: AccountDataBinding<K, S>,
  state: S,
  accountId: AccountId,
  maxAge: number,
): boolean {
  if (
    binding.selectPending(state, accountId) &&
    inflightHeadReads.has(slotOf(binding.datum, accountId))
  )
    return false;
  const at = binding.selectAt(state, accountId);
  // A negative age is a clock that moved, not a fresh read: treated as stale rather than trusted for
  // however long the stamp is ahead.
  const age = at === undefined ? undefined : Date.now() - at;
  return !(maxAge > 0 && age !== undefined && age >= 0 && age < maxAge);
}

// Both sides are the datum's own query type; spreading them loses that to TypeScript, not at runtime.
function withNextPage<K extends AccountDatum>(
  query: AccountDataQuery<K> | undefined,
  next: AccountDataQuery<K>,
): AccountDataQuery<K> {
  return { ...(query as object), ...(next as object) } as AccountDataQuery<K>;
}

/**
 * Read one datum of one account into its slice, through whichever source the router picks. Head
 * reads are guarded by freshness and by an in-flight read of the same account; a next page is guarded
 * only by the pending flag, and pinned to the source that answered the head.
 */
export function fetchAccountData<K extends AccountDatum, S>(
  binding: AccountDataBinding<K, S>,
  descriptor: AccountDescriptor,
  options: FetchAccountDataOptions<K> = {},
) {
  const { maxAge = DEFAULT_ACCOUNT_DATA_MAX_AGE, query, more = false, signal } = options;

  return async (dispatch: Dispatch, getState: () => S, extra: unknown): Promise<void> => {
    const state = getState();
    const accountId = computeAccountId(descriptor);

    let readQuery = query;
    let sourceId: string | undefined;
    if (more) {
      if (binding.selectPending(state, accountId)) return;
      const next = binding.selectNextQuery?.(state, accountId);
      if (next === undefined) return;
      readQuery = withNextPage(query, next);
      sourceId = binding.selectSourceId(state, accountId);
    } else {
      if (!isHeadReadDue(binding, state, accountId, maxAge)) return;
      inflightHeadReads.add(slotOf(binding.datum, accountId));
    }

    dispatch(binding.requested(accountId));
    try {
      const { data, sourceId: answeredBy } = await getAccountDataRouter(extra).read(
        binding.datum,
        descriptor,
        readQuery,
        { signal, sourceId },
      );
      dispatch(
        binding.received({
          accountId,
          data,
          sourceId: answeredBy,
          append: more,
          at: new Date().toISOString(),
        }),
      );
    } catch (error) {
      dispatch(binding.failed({ accountId, error: messageOf(error) }));
    } finally {
      if (!more) inflightHeadReads.delete(slotOf(binding.datum, accountId));
    }
  };
}

/**
 * Read one datum of many accounts into its slice in one router call: each source answers the
 * accounts it is first for in one batch. The same guards as `fetchAccountData` apply to each account, and
 * an account listed twice is read once. Head reads only: a next page has a cursor
 * of its own per account.
 */
export function fetchAccountDataBatch<K extends AccountDatum, S>(
  binding: AccountDataBinding<K, S>,
  descriptors: readonly AccountDescriptor[],
  options: FetchAccountDataBatchOptions<K> = {},
) {
  const { maxAge = DEFAULT_ACCOUNT_DATA_MAX_AGE, query, signal } = options;

  return async (dispatch: Dispatch, getState: () => S, extra: unknown): Promise<void> => {
    const state = getState();
    const latest = new Map<AccountId, AccountDescriptor>();
    for (const descriptor of descriptors) latest.set(computeAccountId(descriptor), descriptor);
    const due = [...latest].filter(([accountId]) =>
      isHeadReadDue(binding, state, accountId, maxAge),
    );
    if (due.length === 0) return;

    for (const [accountId] of due) {
      inflightHeadReads.add(slotOf(binding.datum, accountId));
      dispatch(binding.requested(accountId));
    }
    try {
      let answers;
      try {
        answers = await getAccountDataRouter(extra).readBatch(
          binding.datum,
          due.map(([, descriptor]) => descriptor),
          query,
          {
            signal,
          },
        );
      } catch (error) {
        answers = due.map(() => ({ status: "rejected" as const, reason: error }));
      }
      const at = new Date().toISOString();
      answers.forEach((answer, index) => {
        const [accountId] = due[index];
        dispatch(
          answer.status === "fulfilled"
            ? binding.received({
                accountId,
                data: answer.value.data,
                sourceId: answer.value.sourceId,
                append: false,
                at,
              })
            : binding.failed({ accountId, error: messageOf(answer.reason) }),
        );
      });
    } finally {
      for (const [accountId] of due) inflightHeadReads.delete(slotOf(binding.datum, accountId));
    }
  };
}
