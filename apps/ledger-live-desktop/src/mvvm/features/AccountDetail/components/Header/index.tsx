import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountSettings } from "@features/flow-account-detail-settings";
import { useAccountSettingsAdapter } from "LLD/hooks/useAccountSettingsAdapter";
import { HeaderView } from "./HeaderView";
import { useHeaderViewModel } from "./useHeaderViewModel";

type Props = Readonly<{ account: Account }>;

export function Header({ account }: Props) {
  const viewModel = useHeaderViewModel(account);
  const accountSettingsAdapter = useAccountSettingsAdapter();

  return (
    <>
      <HeaderView viewModel={viewModel} />
      <AccountSettings
        account={account}
        adapter={accountSettingsAdapter}
        isOpen={viewModel.isSettingsOpen}
        onClose={viewModel.onCloseSettings}
        testID="account-detail-settings-dialog"
      />
    </>
  );
}
