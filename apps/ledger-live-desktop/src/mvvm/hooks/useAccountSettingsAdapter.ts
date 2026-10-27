import { useCallback, useMemo } from "react";
import type { Account } from "@ledgerhq/types-live";
import { getTagDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { accountNameWithDefaultSelector } from "@domain/entity-account-name";
import type { AccountSettingsAdapter } from "@features/flow-account-detail-settings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useSyncPhase } from "LLD/hooks/useSyncPhase";
import { removeAccount, updateAccount } from "~/renderer/actions/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { setAccountName, walletSelector } from "~/renderer/reducers/wallet";

function getDerivationTag(account: Account): string | undefined {
  if (account.derivationMode === undefined || account.derivationMode === null) return undefined;
  return getTagDerivationMode(account.currency, account.derivationMode) ?? undefined;
}

export function useAccountSettingsAdapter(): AccountSettingsAdapter<Account> {
  const dispatch = useDispatch();
  const { accountNames } = useSelector(walletSelector);
  const isNameEditDisabled = useSyncPhase() === "syncing";
  const locale = useSelector(localeSelector);

  const getAccountName = useCallback(
    (account: Account) => accountNameWithDefaultSelector(accountNames, account),
    [accountNames],
  );

  const renameAccount = useCallback(
    (account: Account, name: string) => {
      dispatch(updateAccount(account));
      dispatch(setAccountName(account.id, name));
    },
    [dispatch],
  );

  const removeAccountFromPortfolio = useCallback(
    (account: Account) => {
      dispatch(removeAccount(account));
    },
    [dispatch],
  );

  return useMemo(
    () => ({
      isNameEditDisabled,
      locale,
      getAccountName,
      getDerivationTag,
      renameAccount,
      removeAccount: removeAccountFromPortfolio,
    }),
    [isNameEditDisabled, locale, getAccountName, renameAccount, removeAccountFromPortfolio],
  );
}
