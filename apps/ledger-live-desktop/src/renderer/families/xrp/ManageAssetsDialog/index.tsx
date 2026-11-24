import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { StepScreen } from "../components/StepScreen";
import { AssetCard } from "./AssetCard";
import { DeleteAsset } from "./DeleteAsset";
import { EditAsset } from "./EditAsset";

type Props = Readonly<{
  account: Account;
  tokenAccounts: XrpTokenAccount[];
  onClose: () => void;
}>;

export default function ManageAssetsDialog({ account, tokenAccounts, onClose }: Props) {
  const { t } = useTranslation();
  const [editedTokenId, setEditedTokenId] = useState<string>();
  const editedTokenAccount = tokenAccounts.find(tokenAccount => tokenAccount.id === editedTokenId);
  const [deletedTokenAccount, setDeletedTokenAccount] = useState<XrpTokenAccount>();
  const isDeviceBlocked = useDeviceBlocked();

  const close = () => {
    if (!isDeviceBlocked) onClose();
  };

  return (
    <Dialog animated open onOpenChange={open => !open && close()}>
      <DialogContent>
        <DialogBackgroundToneProvider>
          {deletedTokenAccount ? (
            <DeleteAsset
              account={account}
              tokenAccount={deletedTokenAccount}
              onBack={() => setDeletedTokenAccount(undefined)}
              onClose={close}
            />
          ) : editedTokenAccount ? (
            <EditAsset
              account={account}
              tokenAccount={editedTokenAccount}
              onBack={() => setEditedTokenId(undefined)}
              onClose={close}
            />
          ) : (
            <StepScreen title={t("xrp.manageAssets.title")} onBack={close} onClose={close}>
              {tokenAccounts.map(tokenAccount => (
                <AssetCard
                  key={tokenAccount.id}
                  account={account}
                  tokenAccount={tokenAccount}
                  onEdit={({ id }) => setEditedTokenId(id)}
                  onDelete={setDeletedTokenAccount}
                />
              ))}
            </StepScreen>
          )}
        </DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
