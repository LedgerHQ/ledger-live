import React, { useCallback } from "react";
import { useTranslation, Trans } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import DeveloperOpenRow from "../components/DeveloperOpenRow";

const LottieTester = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_LOTTIE_DEBUGGER", undefined)),
    [dispatch],
  );
  return (
    <DeveloperOpenRow
      title={t("settings.experimental.features.testAnimations.title")}
      desc=""
      cta={<Trans i18nKey={"lottieDebugger.buttonTitle"} />}
      onOpen={onOpenModal}
    />
  );
};
export default LottieTester;
