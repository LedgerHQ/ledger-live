import React, { SyntheticEvent, useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { openModal } from "~/renderer/reducers/modals";
import Button from "~/renderer/components/Button";
const ReleaseNotesButton = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const onClick = useCallback(
    (e: SyntheticEvent<HTMLButtonElement>) => {
      e.preventDefault();
      dispatch(openModal("MODAL_RELEASE_NOTES", undefined));
    },
    [dispatch],
  );
  return (
    <Button event="Version details" small primary onClick={onClick}>
      {t("settings.help.releaseNotesBtn")}
    </Button>
  );
};
export default ReleaseNotesButton;
