import React, { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { openReleaseNotes } from "LLD/features/ReleaseNotes/releaseNotesDialog";
import Button from "~/renderer/components/Button";

const ReleaseNotesButton = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();

  const onClick = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.preventDefault();

      dispatch(openReleaseNotes());
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
