import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
import { openModal } from "~/renderer/actions/modals";

const BrazeTools = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_BRAZE_TOOLS", undefined)),
    [dispatch],
  );
  return (
    <SettingsSectionRow
      title={t("settings.developer.brazeTools.title")}
      desc={t("settings.developer.brazeTools.description")}
    >
      <Button onClick={onOpenModal} primary>
        {t("settings.developer.brazeTools.open")}
      </Button>
    </SettingsSectionRow>
  );
};
export default BrazeTools;
