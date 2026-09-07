import { Middleware } from "@reduxjs/toolkit";
import { accountAliasSlice, registerAccountAliases } from "@domain/entity-account-alias";
import { State } from "../reducers";

// tolerates a partial preloaded state, which tests build by hand
const allAccountIds = (accounts: State["accounts"] | undefined) =>
  Array.isArray(accounts)
    ? accounts.flatMap(account => [account.id, ...(account.subAccounts ?? []).map(({ id }) => id)])
    : [];

const sameIds = (a: string[], b: string[]) =>
  a.length === b.length && a.every((id, i) => id === b[i]);

/**
 * Keeps the alias reverse map in sync with the account list. Runs in the dispatch chain rather
 * than in an effect so a route rendered right after accounts land already resolves its alias.
 */
export const createAccountAliasMiddleware = (): Middleware<object, State> => {
  let knownAccounts: State["accounts"] | undefined;
  let knownIds: string[] = [];
  return store => next => action => {
    const result = next(action);
    const { accounts } = store.getState();
    // a sync rewrites the accounts without touching their ids, hence the second comparison
    if (accounts !== knownAccounts) {
      knownAccounts = accounts;
      const ids = allAccountIds(accounts);
      if (!sameIds(ids, knownIds)) {
        knownIds = ids;
        store.dispatch(registerAccountAliases(ids));
      }
    }
    return result;
  };
};

/**
 * Seeds the reverse map from preloaded accounts, which no action ever announces. The real app
 * boots with an empty store and gets its accounts through the middleware above; this covers tests
 * that hand a populated state to `createStore`.
 */
export const withAccountAliases = (state?: State): State | undefined =>
  state && {
    ...state,
    accountAliases: accountAliasSlice.reducer(
      state.accountAliases,
      registerAccountAliases(allAccountIds(state.accounts)),
    ),
  };
