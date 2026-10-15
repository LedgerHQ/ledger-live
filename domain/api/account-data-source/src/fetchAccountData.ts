import type {
  AccountDataAction,
  AccountDataBinding,
  AccountDataKind,
  AccountDataQuery,
} from "@domain/entity-account-data";
import {
  computeAccountUUID,
  type AccountDescriptor,
  type AccountUUID,
} from "@domain/entity-account-descriptor";
import { getAccountDataRouter } from "./extra";
import type { AccountDataRead, AccountDataRouter } from "./router";
import { accountDataQueryKey } from "./queryKey";

export const DEFAULT_ACCOUNT_DATA_MAX_AGE = 30_000;

export type FetchAccountDataOptions<K extends AccountDataKind> = {
  /** A head read of the same query younger than this is not repeated. `0` always reads. */
  maxAge?: number;
  query?: AccountDataQuery<K>;
  /** Read the next page instead of the head. Only a paginated kind has one. */
  more?: boolean;
};

export type FetchAccountDataBatchOptions<K extends AccountDataKind> = Omit<
  FetchAccountDataOptions<K>,
  "more"
>;

type Dispatch = (action: AccountDataAction) => unknown;

type HeadRead = { queryKey: string; done: Promise<void> };

/** Per account and kind: the latest head read started, and the query of the data it last stored. */
type Slot = { generation: number; storedQueryKey?: string; inflight?: HeadRead };

type Plan = "read" | "join" | "skip";

const slotsByRouter = new WeakMap<AccountDataRouter, Map<string, Slot>>();

function slotsOf(router: AccountDataRouter): Map<string, Slot> {
  let slots = slotsByRouter.get(router);
  if (!slots) {
    slots = new Map();
    slotsByRouter.set(router, slots);
  }
  return slots;
}

const slotKeyOf = (kind: AccountDataKind, accountUUID: AccountUUID) => `${kind}|${accountUUID}`;

const messageOf = (error: unknown) => (error instanceof Error ? error.message : String(error));

function planHeadRead<K extends AccountDataKind, S>(
  binding: AccountDataBinding<K, S>,
  state: S,
  accountUUID: AccountUUID,
  queryKey: string,
  maxAge: number,
  slot: Slot | undefined,
): Plan {
  if (maxAge === 0) return "read";
  const inflight = slot?.inflight;
  if (inflight) {
    const joinable = inflight.queryKey === queryKey && binding.selectPending(state, accountUUID);
    return joinable ? "join" : "read";
  }
  // Data restored from an earlier session has an unknown query: read it once again.
  if (slot?.storedQueryKey !== queryKey) return "read";
  const at = binding.selectAt(state, accountUUID);
  // A stamp from the future is a clock that moved, not a fresh read.
  const age = at === undefined ? undefined : Date.now() - at;
  const fresh = age !== undefined && age >= 0 && age < maxAge;
  return fresh ? "skip" : "read";
}

/** Closes the latest head read; `storedQueryKey` is set when its answer was stored. */
function endHeadRead(slots: Map<string, Slot>, key: string, storedQueryKey?: string) {
  const slot = slots.get(key);
  if (!slot) return;
  slot.inflight = undefined;
  if (storedQueryKey !== undefined) slot.storedQueryKey = storedQueryKey;
}

function startHeadRead(slots: Map<string, Slot>, key: string, queryKey: string) {
  const slot = slots.get(key) ?? { generation: 0 };
  let finish: () => void = () => undefined;
  const done = new Promise<void>(resolve => (finish = resolve));
  slot.generation += 1;
  slot.inflight = { queryKey, done };
  slots.set(key, slot);
  return { generation: slot.generation, finish };
}

const isLatest = (slots: Map<string, Slot>, key: string, generation: number) =>
  (slots.get(key)?.generation ?? 0) === generation;

/** Waits for the head reads in flight, including the ones started meanwhile. */
async function settledHead(slots: Map<string, Slot>, key: string): Promise<void> {
  let inflight = slots.get(key)?.inflight;
  while (inflight) {
    await inflight.done;
    inflight = slots.get(key)?.inflight;
  }
}

/** Reads into the slice; `claim` runs before the answer is dispatched and drops it by returning false, `unclaim` when storing it threw. */
async function readInto<K extends AccountDataKind, S>(
  dispatch: Dispatch,
  binding: AccountDataBinding<K, S>,
  accountUUID: AccountUUID,
  read: () => Promise<AccountDataRead<K>>,
  append: boolean,
  claim: (succeeded: boolean) => boolean,
  unclaim: () => void = () => undefined,
): Promise<void> {
  dispatch(binding.requested(accountUUID));
  let answer: AccountDataRead<K>;
  try {
    answer = await read();
  } catch (error) {
    if (claim(false)) dispatch(binding.failed({ accountUUID, error: messageOf(error) }));
    return;
  }
  if (!claim(true)) return;
  const { data, sourceId } = answer;
  try {
    dispatch(
      binding.received({ accountUUID, data, sourceId, append, at: new Date().toISOString() }),
    );
  } catch (error) {
    unclaim();
    dispatch(binding.failed({ accountUUID, error: messageOf(error) }));
  }
}

/** Reads one kind of data of one account into its entity slice, through the source the router picks. */
export function fetchAccountData<K extends AccountDataKind, S>(
  binding: AccountDataBinding<K, S>,
  descriptor: AccountDescriptor,
  options: FetchAccountDataOptions<K> = {},
) {
  const { maxAge = DEFAULT_ACCOUNT_DATA_MAX_AGE, query, more = false } = options;

  return async (dispatch: Dispatch, getState: () => S, extra: unknown): Promise<void> => {
    const state = getState();
    const accountUUID = computeAccountUUID(descriptor);

    let router: AccountDataRouter;
    try {
      router = getAccountDataRouter(extra);
    } catch (error) {
      dispatch(binding.failed({ accountUUID, error: messageOf(error) }));
      return;
    }
    const slots = slotsOf(router);
    const key = slotKeyOf(binding.kind, accountUUID);

    if (more) {
      if (binding.selectPending(state, accountUUID)) return;
      // The stored cursor belongs to the head stored this session: another query would mix pages.
      if (slots.get(key)?.storedQueryKey !== accountDataQueryKey(query)) return;
      const sourceId = binding.selectSourceId(state, accountUUID);
      const nextQuery = binding.selectNextQuery?.(state, accountUUID, query);
      if (sourceId === undefined || nextQuery === undefined) return;
      const generation = slots.get(key)?.generation ?? 0;
      await readInto(
        dispatch,
        binding,
        accountUUID,
        () => router.read(binding.kind, descriptor, { query: nextQuery, sourceId }),
        true,
        () => isLatest(slots, key, generation),
      );
      return;
    }

    const queryKey = accountDataQueryKey(query);
    const plan = planHeadRead(binding, state, accountUUID, queryKey, maxAge, slots.get(key));
    if (plan === "skip") return;
    if (plan === "join") return settledHead(slots, key);

    const { generation, finish } = startHeadRead(slots, key, queryKey);
    const latest = () => isLatest(slots, key, generation);
    try {
      // Bookkeeping first, so what reacts to the answer sees the head read closed.
      await readInto(
        dispatch,
        binding,
        accountUUID,
        () => router.read(binding.kind, descriptor, { query }),
        false,
        succeeded => {
          if (!latest()) return false;
          endHeadRead(slots, key, succeeded ? queryKey : undefined);
          return true;
        },
        () => {
          const slot = slots.get(key);
          if (slot && latest()) slot.storedQueryKey = undefined;
        },
      );
    } finally {
      if (latest()) endHeadRead(slots, key);
      finish();
    }
    return settledHead(slots, key);
  };
}

/** Head reads of one kind of data of many accounts, which the router reads together, with the guards of `fetchAccountData` per account. */
export function fetchAccountDataBatch<K extends AccountDataKind, S>(
  binding: AccountDataBinding<K, S>,
  descriptors: readonly AccountDescriptor[],
  options: FetchAccountDataBatchOptions<K> = {},
) {
  return async (dispatch: Dispatch, getState: () => S, extra: unknown): Promise<void> => {
    await Promise.all(
      descriptors.map(descriptor =>
        fetchAccountData(binding, descriptor, options)(dispatch, getState, extra),
      ),
    );
  };
}
