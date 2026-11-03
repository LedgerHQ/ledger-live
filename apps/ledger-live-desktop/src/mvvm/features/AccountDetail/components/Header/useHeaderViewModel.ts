import { useCallback, useMemo, useState } from "react";
import { useNavigate } from "react-router";
import type { Account } from "@ledgerhq/types-live";
import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_EVENTS,
  accountButtonClickedProps,
  accountSettingsPageViewProps,
} from "@features/flow-account-detail";
import { track, trackPage } from "@shared/analytics";
import { formatAddress } from "@ledgerhq/live-common/utils/addressUtils";
import { useMaybeAccountName } from "~/renderer/reducers/wallet";
import { getAccountTrackingFacts } from "../../utils/accountTracking";

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
  const onOpenSettings = useCallback(() => {
    const facts = getAccountTrackingFacts(account);
    track(
      ACCOUNT_DETAIL_EVENTS.buttonClicked,
      accountButtonClickedProps(facts, ACCOUNT_DETAIL_BUTTONS.accountSettings),
    );
    trackPage({ category: "Account Settings", props: accountSettingsPageViewProps(facts) });
    setIsSettingsOpen(true);
  }, [account]);
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
