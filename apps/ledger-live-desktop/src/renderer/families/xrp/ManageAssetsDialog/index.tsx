import React from "react";
import { useTranslation } from "react-i18next";
import { Dialog, DialogBody, DialogContent, DialogHeader } from "@ledgerhq/lumen-ui-react";
import type { Account } from "@ledgerhq/types-live";
import type { XrpTokenAccount } from "@ledgerhq/live-common/families/xrp/types";
import { AssetCard } from "./AssetCard";

type Props = Readonly<{
  account: Account;
  tokenAccounts: XrpTokenAccount[];
  onClose: () => void;
}>;

export default function ManageAssetsDialog({ account, tokenAccounts, onClose }: Props) {
  const { t } = useTranslation();

  return (
    <Dialog open onOpenChange={open => !open && onClose()}>
      <DialogContent>
        <DialogHeader
          density="expanded"
          title={t("xrp.manageAssets.title")}
          onBack={onClose}
          onClose={onClose}
        />
        <DialogBody className="flex flex-col gap-24 pb-24 pt-12">
          {tokenAccounts.map(tokenAccount => (
            <AssetCard key={tokenAccount.id} account={account} tokenAccount={tokenAccount} />
          ))}
        </DialogBody>
      </DialogContent>
    </Dialog>
  );
}
