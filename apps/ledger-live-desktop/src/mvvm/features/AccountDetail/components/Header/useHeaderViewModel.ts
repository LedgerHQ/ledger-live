import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Account } from "@ledgerhq/types-live";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";

export type HeaderViewModel = Readonly<{
  title: string;
  address: string;
  ledgerId: string;
  ticker: string;
  onBack: () => void;
  onOpenSettings: () => void;
  isSettingsOpen: boolean;
  onCloseSettings: () => void;
}>;

export function useHeaderViewModel(account: Account): HeaderViewModel {
  const navigate = useNavigate();
  const accountName = useMaybeAccountName(account);
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

  return {
    title: accountName ?? "",
    address,
    ledgerId: account.currency.id,
    ticker: account.currency.ticker,
    onBack,
    onOpenSettings,
    isSettingsOpen,
    onCloseSettings,
  };
}
