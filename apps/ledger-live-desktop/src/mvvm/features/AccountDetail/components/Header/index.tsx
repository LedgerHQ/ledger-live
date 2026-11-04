import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountSettings } from "@features/flow-account-detail-settings/web";
import { HeaderView } from "./HeaderView";
import { useAccountDetailSettingsAdapter } from "./useAccountDetailSettingsAdapter";
import { useAccountSettingsTracking } from "./useAccountSettingsTracking";
import { useHeaderViewModel } from "./useHeaderViewModel";

type Props = Readonly<{ account: Account }>;

export function Header({ account }: Props) {
  const viewModel = useHeaderViewModel(account);
  const accountSettingsAdapter = useAccountDetailSettingsAdapter();
  const onSettingsEvent = useAccountSettingsTracking(account);

  return (
    <>
      <HeaderView viewModel={viewModel} />
      <AccountSettings
        account={account}
        adapter={accountSettingsAdapter}
        isOpen={viewModel.isSettingsOpen}
        onClose={viewModel.onCloseSettings}
        onEvent={onSettingsEvent}
        testID="account-detail-settings-dialog"
      />
    </>
  );
}
