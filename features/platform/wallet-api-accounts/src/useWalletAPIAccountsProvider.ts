import { useMemo } from "react";
import { useDispatch } from "react-redux";
import type { ThunkDispatch, UnknownAction } from "@reduxjs/toolkit";
import type { Account as WalletAPIAccount } from "@ledgerhq/wallet-api-core";
import type { AccountNamesState } from "@domain/entity-account-name";
import {
  fetchWalletAPIAccountByLegacyId,
  fetchWalletAPIAccounts,
  type WalletAPIAccountsRootState,
} from "./fetchWalletAPIAccounts";
import type { WalletAPIAccountFilter } from "./toWalletAPIAccounts";

/** What the Wallet API server asks for accounts, instead of converting legacy accounts itself. */
export type WalletAPIAccountsProvider = {
  list: (filter: WalletAPIAccountFilter) => Promise<WalletAPIAccount[]>;
  fromLegacyAccountId: (legacyId: string) => Promise<WalletAPIAccount | undefined>;
};

export function useWalletAPIAccountsProvider(names: AccountNamesState): WalletAPIAccountsProvider {
  const dispatch = useDispatch<ThunkDispatch<WalletAPIAccountsRootState, unknown, UnknownAction>>();
  return useMemo(
    () => ({
      list: filter => dispatch(fetchWalletAPIAccounts(names, filter)),
      fromLegacyAccountId: legacyId => dispatch(fetchWalletAPIAccountByLegacyId(names, legacyId)),
    }),
    [dispatch, names],
  );
}
