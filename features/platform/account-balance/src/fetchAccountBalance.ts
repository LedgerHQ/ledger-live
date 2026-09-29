import {
  accountBalanceFailed,
  accountBalanceReceived,
  accountBalanceRequested,
  accountBalancesSlice,
  type WithAccountBalances,
} from "@domain/entity-account-balance";
import {
  type AccountDataRouter,
  type AccountRef,
  isFresh,
  readThrough,
} from "@features/platform-account-data";

export const DEFAULT_BALANCE_MAX_AGE = 30_000;

const { selectAccountBalanceAt, selectAccountBalanceStatus } = accountBalancesSlice.selectors;

export function fetchAccountBalance(
  router: AccountDataRouter,
  ref: AccountRef,
  { maxAge = DEFAULT_BALANCE_MAX_AGE, signal }: { maxAge?: number; signal?: AbortSignal } = {},
) {
  return async (
    dispatch: (action: { type: string }) => unknown,
    getState: () => WithAccountBalances,
  ): Promise<void> => {
    const state = getState();
    const { accountId } = ref;
    if (selectAccountBalanceStatus(state, accountId).pending) return;
    if (isFresh(selectAccountBalanceAt(state, accountId), maxAge)) return;

    await readThrough(dispatch, {
      requested: accountBalanceRequested(accountId),
      read: async () => {
        const source = router.resolve("getBalances", ref);
        return { balances: await source.getBalances(ref, signal), sourceId: source.id };
      },
      received: ({ balances, sourceId }) =>
        accountBalanceReceived({ accountId, balances, sourceId }),
      failed: error => accountBalanceFailed({ accountId, error }),
    });
  };
}
