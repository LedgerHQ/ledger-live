import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { Account as WalletAPIAccount } from "@ledgerhq/wallet-api-core";
import {
  AccountIdSchema,
  accountsSlice,
  getParentId,
  TokenAccountIdSchema,
  type AccountEntry,
  type AccountsState,
} from "@domain/entity-account";
import { fetchAccountData } from "@domain/api-account-data";
import { cryptoAssetsApi } from "@domain/api-currency-token";
import { selectAccountDataStatus, type AccountDataRootState } from "@domain/entity-account-data";
import { selectAccountBalances, type WithAccountBalances } from "@domain/entity-account-balance";
import { selectAccountReceive, type WithAccountReceives } from "@domain/entity-account-receive";
import type { AccountNamesState } from "@domain/entity-account-name";
import { accountNameOf } from "./accountName";
import { toWalletAPIAccounts, type WalletAPIAccountFilter } from "./toWalletAPIAccounts";
import { walletApiIdOf } from "./walletApiAccountId";

export type WalletAPIAccountsRootState = AccountDataRootState &
  WithAccountBalances &
  WithAccountReceives & { accountEntries: AccountsState };

type Dispatch = ThunkDispatch<WalletAPIAccountsRootState, unknown, UnknownAction>;
type GetState = () => WalletAPIAccountsRootState;

const { selectAccountEntries, selectAccountUUIDByLegacyId, selectAccountEntry } =
  accountsSlice.getSelectors((state: WalletAPIAccountsRootState) => state.accountEntries);

/** By token id, the tickers CAL knows; a token it cannot find is named by its id. */
async function readTickers(dispatch: Dispatch, tokenIds: string[]) {
  const entries = await Promise.all(
    tokenIds.map(async id => {
      const request = dispatch(cryptoAssetsApi.endpoints.findTokenById.initiate({ id }));
      try {
        const token = await request.unwrap();
        return [id, token?.ticker] as const;
      } catch {
        return [id, undefined] as const;
      } finally {
        request.unsubscribe();
      }
    }),
  );
  return Object.fromEntries(entries);
}

/** Reads the balance and receive kinds of `entries`, then builds their Wallet API accounts from the slices. */
async function readWalletAPIAccounts(
  dispatch: Dispatch,
  getState: GetState,
  names: AccountNamesState,
  entries: AccountEntry[],
  filter?: WalletAPIAccountFilter,
): Promise<WalletAPIAccount[]> {
  await Promise.allSettled(
    entries.flatMap(({ descriptor }) => [
      dispatch(fetchAccountData("balance", descriptor)),
      dispatch(fetchAccountData("receive", descriptor)),
    ]),
  );
  const state = getState();
  const tokenIds = new Set<string>();
  for (const { accountUUID } of entries) {
    for (const row of selectAccountBalances(state, accountUUID) ?? []) {
      if (row.assetId.includes("/")) tokenIds.add(row.assetId);
    }
  }
  const tickers = await readTickers(dispatch, [...tokenIds]);
  return entries.flatMap(entry => {
    const balances = selectAccountBalances(state, entry.accountUUID);
    const receive = selectAccountReceive(state, entry.accountUUID);
    // Never read, or no address yet: left out rather than listed empty.
    if (!balances) return [];
    if (entry.descriptor.type === "utxo" && receive?.status !== "ready") return [];
    try {
      const name = accountNameOf(names, entry);
      const readAt = selectAccountDataStatus(state, "balance", entry.accountUUID)?.readAt;
      return toWalletAPIAccounts({ entry, name, balances, receive, readAt, tickers }, filter);
    } catch {
      // A network this build does not know: the other accounts are still listed.
      return [];
    }
  });
}

/** Every account of the user a live app may see, in the user's order, read through the account data layer. */
export function fetchWalletAPIAccounts(names: AccountNamesState, filter?: WalletAPIAccountFilter) {
  return (dispatch: Dispatch, getState: GetState) =>
    readWalletAPIAccounts(dispatch, getState, names, selectAccountEntries(getState()), filter);
}

/** The Wallet API account of a legacy account or token account id, as a legacy screen such as the account drawer picks it. */
export function fetchWalletAPIAccountByLegacyId(names: AccountNamesState, legacyId: string) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const token = TokenAccountIdSchema.safeParse(legacyId);
    const account = AccountIdSchema.safeParse(legacyId);
    const parentId = token.success ? getParentId(token.data) : account.data;
    if (!parentId) return undefined;
    const state = getState();
    const accountUUID = selectAccountUUIDByLegacyId(state, parentId);
    const entry = accountUUID && selectAccountEntry(state, accountUUID);
    if (!entry) return undefined;
    const accounts = await readWalletAPIAccounts(dispatch, getState, names, [entry]);
    return accounts.find(({ id }) => id === walletApiIdOf(legacyId));
  };
}
