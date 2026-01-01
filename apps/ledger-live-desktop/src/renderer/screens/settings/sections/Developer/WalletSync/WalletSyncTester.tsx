import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/lumen-ui-react";
import { openModal } from "~/renderer/actions/modals";

const WalletSyncTester = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_WALLET_SYNC_DEBUGGER", undefined)),
    [dispatch],
  );
  return (
    <SettingsSectionRow
      title={t("settings.developer.debugWalletSync.title")}
      desc={t("settings.developer.debugWalletSync.description")}
    >
      <Button size="sm" appearance="accent" onClick={onOpenModal}>
        {t("settings.developer.debugWalletSync.cta")}
      </Button>
    </SettingsSectionRow>
  );
};
export default WalletSyncTester;
