import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Account } from "@ledgerhq/types-live";
import { getTagDerivationMode } from "@ledgerhq/ledger-wallet-framework/derivation";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { MAX_ACCOUNT_NAME_LENGTH, validateNameEdition } from "@domain/entity-account-name";
import type { AdvancedLogsContentProps } from "@features/flow-account-detail-settings";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import { useSyncPhase } from "LLD/hooks/useSyncPhase";
import { updateAccount } from "~/renderer/actions/accounts";
import { localeSelector } from "~/renderer/reducers/settings";
import { setAccountName, useMaybeAccountName } from "~/renderer/reducers/wallet";

export type HeaderViewModel = Readonly<{
  title: string;
  address: string;
  ledgerId: string;
  ticker: string;
  onBack: () => void;
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
  nameMaxLength: number;
  isNameEditDisabled: boolean;
  onConfirmName: (name: string) => void;
  advancedLogs: AdvancedLogsContentProps;
}>;

function getDerivationTag(account: Account): string | undefined {
  if (account.derivationMode === undefined || account.derivationMode === null) return undefined;
  return getTagDerivationMode(account.currency, account.derivationMode) ?? undefined;
}

export function useHeaderViewModel(account: Account): HeaderViewModel {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const isSyncing = useSyncPhase() === "syncing";
  const accountName = useMaybeAccountName(account);
  const locale = useSelector(localeSelector);
  const address = useMemo(
    () => formatAddress(account.freshAddress, { prefixLength: 4, suffixLength: 4 }),
    [account.freshAddress],
  );

  const onBack = useCallback(() => {
    navigate(-1);
  }, [navigate]);

  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const onOpenSettings = useCallback(() => setIsSettingsOpen(true), []);
  const onCloseSettings = useCallback(() => setIsSettingsOpen(false), []);
  const onConfirmName = useCallback(
    (name: string) => {
      dispatch(updateAccount(account));
      dispatch(setAccountName(account.id, validateNameEdition(account, name)));
      setIsSettingsOpen(false);
    },
    [account, dispatch],
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
    [account, locale],
  );

  return {
    title: accountName ?? "",
    address,
    ledgerId: account.currency.id,
    ticker: account.currency.ticker,
    onBack,
    onOpenSettings,
    isSettingsOpen,
    onCloseSettings,
    nameMaxLength: MAX_ACCOUNT_NAME_LENGTH,
    isNameEditDisabled: isSyncing,
    onConfirmName,
    advancedLogs,
  };
}
