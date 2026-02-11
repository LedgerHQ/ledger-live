import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import DeveloperOpenRow from "../../components/DeveloperOpenRow";

const WalletSyncTester = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_WALLET_SYNC_DEBUGGER", undefined)),
    [dispatch],
  );

  return (
    <DeveloperOpenRow
      title={t("settings.developer.debugWalletSync.title")}
      desc={t("settings.developer.debugWalletSync.description")}
      cta={t("settings.developer.debugWalletSync.cta")}
      onOpen={onOpenModal}
    />
  );
};

export default WalletSyncTester;
