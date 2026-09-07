import React from "react";
import { useTranslation } from "react-i18next";
import { Button, Spot } from "@ledgerhq/lumen-ui-react";
import { Refresh } from "@ledgerhq/lumen-ui-react/symbols";

type WalletSyncViewProps = {
  WalletSyncButton: React.ComponentType<{ onPress: () => void }>;
  onWalletSyncPress: () => void;
  onSkipWalletSyncPress: () => void;
};

export function WalletSyncView({
  WalletSyncButton,
  onWalletSyncPress,
  onSkipWalletSyncPress,
}: WalletSyncViewProps) {
  const { t } = useTranslation();

  return (
    <div className="flex flex-col items-center" data-testid="send-add-contact-sync-wallet-step">
      <div className="pointer-events-none absolute inset-x-0 top-0 h-full bg-gradient-muted" />
      <div className="flex flex-col gap-32">
        <div className="flex w-full flex-col items-center gap-24">
          <Spot appearance="icon" size={72} icon={Refresh} />
          <div className="flex flex-col items-center gap-8 text-center">
            <h3 className="heading-4-semi-bold text-base">
              {t("newSendFlow.addContact.syncWallet.title")}
            </h3>
            <p className="body-2 text-muted">
              {t("newSendFlow.addContact.syncWallet.description")}
            </p>
          </div>
        </div>
        <div className="flex w-full flex-col items-center gap-16">
          <WalletSyncButton onPress={onWalletSyncPress} />
          <Button
            data-testid="send-add-contact-sync-wallet-later"
            appearance="gray"
            size="lg"
            className="w-full"
            onClick={onSkipWalletSyncPress}
          >
            {t("walletSync.entryPoints.sendFlow.later")}
          </Button>
        </div>
      </div>
    </div>
  );
}
