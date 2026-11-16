import type { AccountUUID } from "@domain/entity-account-descriptor";
import { SwapHistoryEntrySchema, type SwapHistoryEntry, type SwapHistoryState } from "../schema";
import { swapHistorySynced } from "../slice";

/** A `BigNumber`, as the legacy swap history stores amounts. */
type LegacyAmount = { toFixed(): string; toFixed(decimalPlaces: number): string };

/** The legacy `SwapOperation` of `@ledgerhq/types-live`, the fields the mirror reads. */
export type LegacySwapOperation = {
  swapId: string;
  provider: string;
  status: string;
  receiverAccountId: string;
  tokenId?: string;
  operationId: string;
  fromAmount: LegacyAmount;
  toAmount: LegacyAmount;
  finalAmount?: LegacyAmount;
  fromAccountId?: string;
  feesAmount?: string;
  payoutFeesAmount?: string;
  createdAt?: number;
};

type LegacySwapHistoryHolder = {
  id: string;
  swapHistory?: readonly LegacySwapOperation[];
};

/** A legacy `Account` and its token accounts, the fields the mirror reads. */
export type LegacySwapAccount = LegacySwapHistoryHolder & {
  currency: { id: string };
  subAccounts?: readonly (LegacySwapHistoryHolder & { token: { id: string } })[];
};

export type SwapHistoryReduxStore<S> = {
  getState: () => S;
  dispatch: (action: ReturnType<typeof swapHistorySynced>) => unknown;
  subscribe: (listener: () => void) => () => void;
};

export type ConnectSwapHistoryOptions<S> = {
  selectLegacyAccounts: (state: S) => readonly LegacySwapAccount[];
  /** The `AccountUUID` of a top-level legacy account id, `undefined` for an account the accounts slice does not list. */
  toAccountUUID: (state: S, legacyAccountId: string) => AccountUUID | undefined;
  /** What `toAccountUUID` reads, such as the accounts slice: the history is mirrored again when it changes. */
  selectAccountIndex: (state: S) => unknown;
  /** A swap the entity cannot express, left out. */
  onError?: (error: unknown, swap: LegacySwapOperation) => void;
};

type ResolvedAccount = { accountUUID: AccountUUID; assetId: string };

/** Every reference the history is computed from, to skip an update that changes none. */
function inputsOf(accounts: readonly LegacySwapAccount[], accountIndex: unknown): unknown[] {
  const inputs: unknown[] = [accountIndex];
  for (const account of accounts) {
    for (const holder of [account, ...(account.subAccounts ?? [])]) {
      // An empty history is new on each account update; it mirrors to nothing either way.
      inputs.push(holder.id, holder.swapHistory?.length ? holder.swapHistory : undefined);
    }
  }
  return inputs;
}

const sameInputs = (a: readonly unknown[], b: readonly unknown[]) =>
  a.length === b.length && a.every((value, i) => value === b[i]);

/** Mirrors the legacy `swapHistory` of each account and token account into the swap history slice. */
export function connectSwapHistoryStore<S>(
  store: SwapHistoryReduxStore<S>,
  {
    selectLegacyAccounts,
    toAccountUUID,
    selectAccountIndex,
    onError,
  }: ConnectSwapHistoryOptions<S>,
): () => void {
  let lastAccounts: readonly LegacySwapAccount[] | undefined;
  let lastIndex: unknown;
  let lastInputs: unknown[] | undefined;
  // A swap left out is reported once.
  const reported = new WeakSet<LegacySwapOperation>();

  const mirror = (state: S, accounts: readonly LegacySwapAccount[]): SwapHistoryState => {
    const owners = new Map<string, { parentId: string; assetId: string }>();
    for (const account of accounts) {
      owners.set(account.id, { parentId: account.id, assetId: account.currency.id });
      for (const sub of account.subAccounts ?? []) {
        owners.set(sub.id, { parentId: account.id, assetId: sub.token.id });
      }
    }
    const resolve = (legacyId: string): ResolvedAccount | undefined => {
      const owner = owners.get(legacyId);
      const accountUUID = owner && toAccountUUID(state, owner.parentId);
      return owner && accountUUID ? { accountUUID, assetId: owner.assetId } : undefined;
    };

    const toEntry = (
      holder: ResolvedAccount,
      swap: LegacySwapOperation,
    ): SwapHistoryEntry | null => {
      const from = swap.fromAccountId === undefined ? undefined : resolve(swap.fromAccountId);
      // The legacy history drops a swap whose sender is gone; so does the mirror.
      if (swap.fromAccountId !== undefined && !from) return null;
      const to = resolve(swap.receiverAccountId);
      const result = SwapHistoryEntrySchema.safeParse({
        swapId: swap.swapId,
        provider: swap.provider,
        status: swap.status,
        accountUUID: holder.accountUUID,
        assetId: holder.assetId,
        fromAccountUUID: from?.accountUUID,
        fromAssetId: from?.assetId,
        toAccountUUID: to?.accountUUID,
        // A token the receiving account holds no account of yet is only known by `tokenId`.
        toAssetId: swap.tokenId ?? to?.assetId,
        operationId: swap.operationId || undefined,
        fromAmount: swap.fromAmount.toFixed(0),
        toAmount: swap.toAmount.toFixed(),
        finalAmount: swap.finalAmount?.toFixed(),
        feesAmount: swap.feesAmount,
        payoutFeesAmount: swap.payoutFeesAmount,
        createdAt: swap.createdAt,
      });
      if (result.success) return result.data;
      if (!reported.has(swap)) {
        reported.add(swap);
        onError?.(result.error, swap);
      }
      return null;
    };

    const next: SwapHistoryState = {};
    for (const account of accounts) {
      const holders = [account, ...(account.subAccounts ?? [])];
      for (const holder of holders) {
        if (!holder.swapHistory?.length) continue;
        const resolved = resolve(holder.id);
        if (!resolved) continue;
        const entries = holder.swapHistory.flatMap(swap => toEntry(resolved, swap) ?? []);
        if (entries.length === 0) continue;
        next[resolved.accountUUID] = [...(next[resolved.accountUUID] ?? []), ...entries];
      }
    }
    return next;
  };

  const sync = () => {
    const state = store.getState();
    const accounts = selectLegacyAccounts(state);
    const accountIndex = selectAccountIndex(state);
    if (accounts === lastAccounts && accountIndex === lastIndex) return;
    lastAccounts = accounts;
    lastIndex = accountIndex;
    const inputs = inputsOf(accounts, accountIndex);
    if (lastInputs && sameInputs(inputs, lastInputs)) return;
    lastInputs = inputs;
    store.dispatch(swapHistorySynced(mirror(state, accounts)));
  };

  sync();
  return store.subscribe(sync);
}
