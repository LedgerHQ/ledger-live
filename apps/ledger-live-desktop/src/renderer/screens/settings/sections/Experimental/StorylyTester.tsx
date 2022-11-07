import React, { useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import Button from "~/renderer/components/Button";
import { openModal } from "~/renderer/actions/modals";

const StorylyTester = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(() => dispatch(openModal("MODAL_STORYLY_DEBUGGER")), [dispatch]);

  return (
    <SettingsSectionRow
      title={t("settings.experimental.features.testStories.title")}
      desc={t("settings.experimental.features.testStories.description")}
    >
      <Button onClick={onOpenModal} primary>
        <Trans i18nKey={"storylyDebugger.buttonTitle"} />
      </Button>
    </SettingsSectionRow>
  );
};

export default StorylyTester;
