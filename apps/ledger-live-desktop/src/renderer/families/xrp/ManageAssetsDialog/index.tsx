import React from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import type { XrpFamily } from "../types";
import { AssetCard } from "./AssetCard";
import { DeleteAsset } from "./DeleteAsset";
import { EditAsset } from "./EditAsset";
import { StepScreen } from "../components/StepScreen";
import { useManageAssetsDialogViewModel } from "./useManageAssetsDialogViewModel";

function ManageAssetsDialogContent({ account }: Readonly<{ account: Account }>) {
  const { t } = useTranslation();
  const viewModel = useManageAssetsDialogViewModel(account);
  const selected = viewModel.selectedAsset;
  const SelectedScreen = selected?.action === "edit" ? EditAsset : DeleteAsset;

  return (
    <Dialog open={viewModel.isOpen} onOpenChange={open => !open && viewModel.onClose()}>
      <DialogContent>
        <DialogBackgroundToneProvider>
          {selected ? (
            <SelectedScreen
              key={`${selected.action}-${selected.tokenAccount.id}`}
              account={account}
              tokenAccount={selected.tokenAccount}
              onBackToList={viewModel.onBackToList}
              onClose={viewModel.onClose}
            />
          ) : (
            <StepScreen title={t("xrp.manageAssets.title")} onClose={viewModel.onClose}>
              {viewModel.tokenAccounts.map(tokenAccount => (
                <AssetCard
                  key={tokenAccount.id}
                  account={account}
                  tokenAccount={tokenAccount}
                  onEdit={viewModel.onEdit}
                  onDelete={viewModel.onDelete}
                />
              ))}
            </StepScreen>
          )}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}

const ManageAssetsDialog: NonNullable<XrpFamily["AccountDialog"]> = ({ account }) => {
  if (account.type !== "Account") return null;

  return <ManageAssetsDialogContent account={account} />;
};

export default ManageAssetsDialog;
