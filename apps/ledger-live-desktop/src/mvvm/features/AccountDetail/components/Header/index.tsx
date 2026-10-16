import React from "react";
import type { Account } from "@ledgerhq/types-live";
import { AccountSettingsDialog } from "@features/flow-account-detail-settings";
import { HeaderView } from "./HeaderView";
import { useHeaderViewModel } from "./useHeaderViewModel";

type Props = Readonly<{ account: Account }>;

export function Header({ account }: Props) {
  const viewModel = useHeaderViewModel(account);

  return (
    <>
      <HeaderView viewModel={viewModel} />
      <AccountSettingsDialog
        isOpen={viewModel.isSettingsOpen}
        accountName={viewModel.title}
        onClose={viewModel.onCloseSettings}
        onChangeName={viewModel.onCloseSettings}
        onViewAdvancedLogs={viewModel.onCloseSettings}
        onConfirmRemove={viewModel.onCloseSettings}
        testID="account-detail-settings-dialog"
      />
    </>
  );
}
