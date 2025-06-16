import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
import { openModal } from "~/renderer/actions/modals";
import { Icons } from "@ledgerhq/react-ui/index";

const NftsTools = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_NFTS_TOOLS", undefined)),
    [dispatch],
  );
  return (
    <SettingsSectionRow
      title={t("settings.developer.debugNfts.title")}
      desc={t("settings.developer.debugNfts.description")}
    >
      <Button onClick={onOpenModal} primary>
        <Icons.Nft />
      </Button>
    </SettingsSectionRow>
  );
};
export default NftsTools;
