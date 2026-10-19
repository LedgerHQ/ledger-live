import { useCallback, useMemo } from "react";
import { MAX_ACCOUNT_NAME_LENGTH, validateNameEdition } from "@domain/entity-account-name";
import type { AdvancedLogsContentProps } from "../AdvancedLogsContent/types";
import type { AccountSettingsAccount, AccountSettingsAdapter } from "./types.web";

export type AccountSettingsViewModel = Readonly<{
  accountName: string;
  ticker: string;
  nameMaxLength: number;
  isNameEditDisabled: boolean;
  advancedLogs: AdvancedLogsContentProps;
  onConfirmName: (name: string) => void;
  onConfirmRemove: () => void;
}>;

export function useAccountSettingsViewModel<TAccount extends AccountSettingsAccount>(
  account: TAccount,
  adapter: AccountSettingsAdapter<TAccount>,
  onClose: () => void,
): AccountSettingsViewModel {
  const { isNameEditDisabled, locale, getAccountName, getDerivationTag, renameAccount } = adapter;

  const onConfirmName = useCallback(
    (name: string) => {
      renameAccount(account, validateNameEdition(account, name));
      onClose();
    },
    [account, renameAccount, onClose],
  );

  const advancedLogs = useMemo<AdvancedLogsContentProps>(
    () => ({
      input: {
        xpub: account.xpub || undefined,
        index: account.index,
        freshAddressPath: account.freshAddressPath,
        id: account.id,
        blockHeight: account.blockHeight,
        lastSyncDate: account.lastSyncDate,
      },
      locale,
      derivationTag: getDerivationTag(account),
    }),
    [account, locale, getDerivationTag],
  );

  return {
    accountName: getAccountName(account),
    ticker: account.currency.ticker,
    nameMaxLength: MAX_ACCOUNT_NAME_LENGTH,
    isNameEditDisabled,
    advancedLogs,
    onConfirmName,
    onConfirmRemove: onClose,
  };
}
