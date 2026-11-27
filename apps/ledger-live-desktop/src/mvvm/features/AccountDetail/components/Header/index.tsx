import React, { Suspense } from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountSettings } from "@features/flow-account-detail-settings/web";
import { useManageAssetsAction } from "LLD/hooks/useManageAssetsAction";
import { HeaderView } from "./HeaderView";
import { useAccountDetailSettingsAdapter } from "./useAccountDetailSettingsAdapter";
import { useAccountSettingsTracking } from "./useAccountSettingsTracking";
import { useHeaderViewModel } from "./useHeaderViewModel";

type Props = Readonly<{ account: Account }>;

type SettingsProps = Props & Readonly<{ isOpen: boolean; onClose: () => void }>;

function HeaderAccountSettings({ account, isOpen, onClose }: SettingsProps) {
  const accountSettingsAdapter = useAccountDetailSettingsAdapter();
  const onSettingsEvent = useAccountSettingsTracking(account);
  const onManageAssets = useManageAssetsAction(account);

  return (
    <AccountSettings
      account={account}
      adapter={accountSettingsAdapter}
      isOpen={isOpen}
      onClose={onClose}
      onEvent={onSettingsEvent}
      onManageAssets={onManageAssets}
      testID="account-detail-settings-dialog"
    />
  );
}

export function Header({ account }: Props) {
  const viewModel = useHeaderViewModel(account);

  return (
    <>
      <HeaderView viewModel={viewModel} />
      <Suspense fallback={null}>
        <HeaderAccountSettings
          account={account}
          isOpen={viewModel.isSettingsOpen}
          onClose={viewModel.onCloseSettings}
        />
      </Suspense>
    </>
  );
}
