import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
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
      title={t("settings.experimental.features.testWalletSync.title")}
      desc={t("settings.experimental.features.testWalletSync.description")}
    >
      <Button onClick={onOpenModal} primary>
        {t("settings.experimental.features.testWalletSync.cta")}
      </Button>
    </SettingsSectionRow>
  );
};
export default WalletSyncTester;
