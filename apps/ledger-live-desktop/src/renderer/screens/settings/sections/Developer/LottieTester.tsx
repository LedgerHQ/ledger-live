import React, { useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useDispatch } from "react-redux";
import { SettingsSectionRow } from "~/renderer/screens/settings/SettingsSection";
import { Button } from "@ledgerhq/ldls-ui-react";
import { openModal } from "~/renderer/actions/modals";
const LottieTester = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_LOTTIE_DEBUGGER", undefined)),
    [dispatch],
  );
  return (
    <SettingsSectionRow title={t("settings.experimental.features.testAnimations.title")} desc="">
      <Button onClick={onOpenModal} appearance="accent" size="sm">
        <Trans i18nKey={"lottieDebugger.buttonTitle"} />
      </Button>
    </SettingsSectionRow>
  );
};
export default LottieTester;
