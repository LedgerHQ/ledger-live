import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
import { openModal } from "~/renderer/actions/modals";

const SimpleHashTools = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_SIMPLEHASH_TOOLS", undefined)),
    [dispatch],
  );
  return (
    <SettingsSectionRow
      title={t("settings.experimental.features.testSimpleHash.title")}
      desc={t("settings.experimental.features.testSimpleHash.description")}
    >
      <Button onClick={onOpenModal} primary>
        {t("settings.experimental.features.testSimpleHash.cta")}
      </Button>
    </SettingsSectionRow>
  );
};
export default SimpleHashTools;
