import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch } from "LLD/hooks/redux";
import { openModal } from "~/renderer/actions/modals";
import DeveloperOpenRow from "../../components/DeveloperOpenRow";

const BrazeTools = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onOpenModal = useCallback(
    () => dispatch(openModal("MODAL_BRAZE_TOOLS", undefined)),
    [dispatch],
  );
  return (
    <DeveloperOpenRow
      title={t("settings.developer.brazeTools.title")}
      desc={t("settings.developer.brazeTools.description")}
      cta={t("settings.developer.brazeTools.open")}
      onOpen={onOpenModal}
    />
  );
};
export default BrazeTools;
