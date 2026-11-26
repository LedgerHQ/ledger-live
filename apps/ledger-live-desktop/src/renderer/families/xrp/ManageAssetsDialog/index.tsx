import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogContent } from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { DialogBackgroundToneProvider } from "@shared/ui-info-state/web";
import { useDeviceBlocked } from "~/renderer/components/DeviceAction/DeviceBlocker";
import { FrozenTokensBanner } from "../components/FrozenTokensBanner";
import { StepScreen } from "../components/StepScreen";
import { isFrozenToken } from "../utils";
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
  const frozenTokens = tokenAccounts
    .filter(tokenAccount => isFrozenToken(tokenAccount, account))
    .map(tokenAccount => tokenAccount.token);

  const close = () => {
    if (!isDeviceBlocked) onClose();
  };

  const renderScreen = () => {
    if (deletedTokenAccount) {
      return (
        <DeleteAsset
          account={account}
          tokenAccount={deletedTokenAccount}
          onBack={() => setDeletedTokenAccount(undefined)}
          onClose={close}
        />
      );
    }

    if (editedTokenAccount) {
      return (
        <EditAsset
          account={account}
          tokenAccount={editedTokenAccount}
          onBack={() => setEditedTokenId(undefined)}
          onClose={close}
        />
      );
    }

    return (
      <StepScreen title={t("xrp.manageAssets.title")} onBack={close} onClose={close}>
        <FrozenTokensBanner tokens={frozenTokens} />
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
    );
  };

  return (
    <Dialog animated open onOpenChange={open => !open && close()}>
      <DialogContent>
        <DialogBackgroundToneProvider>{renderScreen()}</DialogBackgroundToneProvider>
      </DialogContent>
    </Dialog>
  );
}
