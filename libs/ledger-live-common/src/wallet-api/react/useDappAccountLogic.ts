import { useMemo, useEffect, useState } from "react";
import { AccountLike } from "@ledgerhq/types-live";
import { AppManifest, DiscoverDB } from "../types";
import { getParentAccount } from "../../account";
import { SetCurrentAccountHistDb } from "./types";
import { useDappCurrentAccount } from "./useDappCurrentAccount";

export function useDappAccountLogic({
  manifest,
  accounts,
  currentAccountHistDb,
  setCurrentAccountHistDb,
  initialAccountId,
}: {
  manifest: AppManifest;
  accounts: AccountLike[];
  currentAccountHistDb?: DiscoverDB["currentAccountHist"];
  setCurrentAccountHistDb?: SetCurrentAccountHistDb;
  initialAccountId?: string;
}) {
  const [initialAccountSelected, setInitialAccountSelected] = useState(false);
  const { currentAccount, setCurrentAccount, setCurrentAccountHist } = useDappCurrentAccount(
    manifest.id,
    setCurrentAccountHistDb,
  );

  const currentParentAccount = useMemo(() => {
    if (currentAccount) {
      return getParentAccount(currentAccount, accounts);
    }
  }, [currentAccount, accounts]);

  const currentAccountIdFromHist = useMemo(() => {
    return currentAccountHistDb?.[manifest.id];
  }, [manifest, currentAccountHistDb]);

  const currentAccountFromHist = useMemo(() => {
    if (!currentAccountIdFromHist) return undefined;
    const account = accounts.find(a => a.id === currentAccountIdFromHist);
    if (!account) return undefined;

    const networks = manifest.dapp?.networks;
    if (!networks) return undefined;

    const accountCurrencyId =
      account.type === "TokenAccount" ? account.token.id : account.currency.id;
    const accountNetworkCurrency =
      account.type === "TokenAccount" ? account.token.parentCurrencyId : account.currency.id;

    const isCompatible = networks.some(
      n => n.currency === accountCurrencyId || n.currency === accountNetworkCurrency,
    );

    return isCompatible ? account : undefined;
  }, [accounts, currentAccountIdFromHist, manifest.dapp?.networks]);

  const initialAccount = useMemo(() => {
    if (!initialAccountId) return;
    return accounts.find(account => account.id === initialAccountId);
  }, [accounts, initialAccountId]);

  useEffect(() => {
    if (initialAccountSelected) {
      return;
    }

    if (initialAccount && !initialAccountSelected) {
      setCurrentAccount(initialAccount);
      setCurrentAccountHist(manifest.id, initialAccount);
      setInitialAccountSelected(true);
      return;
    }

    if (currentAccountFromHist) {
      setCurrentAccount(currentAccountFromHist);
      return;
    }
  }, [
    initialAccountSelected,
    initialAccount,
    currentAccountFromHist,
    setCurrentAccount,
    setCurrentAccountHist,
    manifest.id,
  ]);

  return {
    currentAccount,
    currentAccountFromHist,
    setCurrentAccount,
    currentParentAccount,
    setCurrentAccountHist,
  };
}
