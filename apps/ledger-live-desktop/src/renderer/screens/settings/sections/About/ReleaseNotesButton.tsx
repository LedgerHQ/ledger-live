import React, { useCallback } from "react";
import { useDispatch } from "LLD/hooks/redux";
import { useTranslation } from "react-i18next";
import { openModal } from "~/renderer/actions/modals";
import { openReleaseNotes } from "LLD/features/ReleaseNotes/releaseNotesDialog";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";
import Button from "~/renderer/components/Button";

const ReleaseNotesButton = () => {
  const { t } = useTranslation();
  const dispatch = useDispatch();
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("desktop");

  const onClick = useCallback(
    (e?: React.MouseEvent) => {
      if (e) e.preventDefault();
      if (shouldDisplayWallet40MainNav) {
        dispatch(openReleaseNotes());
      } else {
        dispatch(openModal("MODAL_RELEASE_NOTES", undefined));
      }
    },
    [dispatch, shouldDisplayWallet40MainNav],
  );
  return (
    <Button event="Version details" small primary onClick={onClick}>
      {t("settings.help.releaseNotesBtn")}
    </Button>
  );
};
export default ReleaseNotesButton;
