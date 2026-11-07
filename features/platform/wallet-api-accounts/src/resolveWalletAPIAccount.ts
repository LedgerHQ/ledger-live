import { accountsSlice, type AccountEntry } from "@domain/entity-account";
import { fetchAccountData } from "@domain/api-account-data";
import {
  BalanceAssetIdSchema,
  selectAccountBalances,
  type BalanceAssetId,
} from "@domain/entity-account-balance";
import { currencyIdFromNetwork } from "@domain/entity-account-descriptor";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { WalletAPIAccountsRootState } from "./fetchWalletAPIAccounts";
import { walletApiAccountIdOf, walletApiTokenAccountIdOf } from "./walletApiAccountId";

/** The account a Wallet API account id names, and the asset it holds: the native coin or one of its tokens. */
export type WalletAPIAccountTarget = { entry: AccountEntry; assetId: BalanceAssetId };

type Dispatch = ThunkDispatch<WalletAPIAccountsRootState, unknown, UnknownAction>;
type GetState = () => WalletAPIAccountsRootState;

const { selectAccountEntries } = accountsSlice.getSelectors(
  (state: WalletAPIAccountsRootState) => state.accountEntries,
);

const nativeAssetOf = (entry: AccountEntry): BalanceAssetId =>
  BalanceAssetIdSchema.parse(currencyIdFromNetwork(entry.descriptor.network));

function findToken(state: WalletAPIAccountsRootState, entries: AccountEntry[], id: string) {
  for (const entry of entries) {
    const row = selectAccountBalances(state, entry.accountUUID)?.find(
      ({ assetId }) => walletApiTokenAccountIdOf(entry, assetId) === id,
    );
    if (row) return { entry, assetId: row.assetId };
  }
  return undefined;
}

/** Resolves a Wallet API account id, `tokenCurrency` naming the token of a parent account id when given. */
export function resolveWalletAPIAccount(walletApiAccountId: string, tokenCurrency?: string) {
  return async (dispatch: Dispatch, getState: GetState) => {
    const entries = selectAccountEntries(getState());
    const parent = entries.find(entry => walletApiAccountIdOf(entry) === walletApiAccountId);
    if (parent) {
      if (!tokenCurrency) return { entry: parent, assetId: nativeAssetOf(parent) };
      const token = BalanceAssetIdSchema.safeParse(tokenCurrency);
      return token.success ? { entry: parent, assetId: token.data } : undefined;
    }
    const known = findToken(getState(), entries, walletApiAccountId);
    if (known) return known;
    const unread = entries.filter(
      ({ accountUUID }) => selectAccountBalances(getState(), accountUUID) === undefined,
    );
    if (unread.length === 0) return undefined;
    await Promise.allSettled(
      unread.map(({ descriptor }) => dispatch(fetchAccountData("balance", descriptor))),
    );
    return findToken(getState(), entries, walletApiAccountId);
  };
}
