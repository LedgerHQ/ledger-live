import React from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch } from "react-redux";
import { openModal } from "~/renderer/actions/modals";
import Button from "~/renderer/components/Button";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";

const StorylyTester = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = () => dispatch(openModal("MODAL_STORYLY_DEBUGGER", undefined));

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
