import { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import gt from "semver/functions/gt";
import { lastUsedVersionSelector } from "~/renderer/reducers/settings";
import { saveSettings } from "~/renderer/actions/settings";
import { openModal } from "~/renderer/actions/modals";
import { openReleaseNotes } from "LLD/features/ReleaseNotes/releaseNotesDialog";
import { useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/walletFeaturesConfig/useWalletFeaturesConfig";

const IsNewVersion = () => {
  const dispatch = useDispatch();
  const lastUsedVersion = useSelector(lastUsedVersionSelector);
  const currentVersion = __APP_VERSION__;
  const { shouldDisplayWallet40MainNav } = useWalletFeaturesConfig("desktop");

  useEffect(() => {
    if (gt(currentVersion, lastUsedVersion)) {
      if (shouldDisplayWallet40MainNav) {
        dispatch(openReleaseNotes());
      } else {
        dispatch(openModal("MODAL_RELEASE_NOTES", undefined));
      }
      dispatch(
        saveSettings({
          lastUsedVersion: currentVersion,
        }),
      );
    }
  }, [currentVersion, dispatch, lastUsedVersion, shouldDisplayWallet40MainNav]);
  return null;
};
export default IsNewVersion;
