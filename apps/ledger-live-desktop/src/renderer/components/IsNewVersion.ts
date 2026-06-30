import { useEffect } from "react";
import { useDispatch, useSelector } from "LLD/hooks/redux";
import gt from "semver/functions/gt";
import { lastUsedVersionSelector } from "~/renderer/reducers/settings";
import { saveSettings } from "~/renderer/actions/settings";
import { openReleaseNotes } from "LLD/features/ReleaseNotes/releaseNotesDialog";

const IsNewVersion = () => {
  const dispatch = useDispatch();
  const lastUsedVersion = useSelector(lastUsedVersionSelector);
  const currentVersion = __APP_VERSION__;

  useEffect(() => {
    if (gt(currentVersion, lastUsedVersion)) {
      dispatch(openReleaseNotes());

      dispatch(
        saveSettings({
          lastUsedVersion: currentVersion,
        }),
      );
    }
  }, [currentVersion, dispatch, lastUsedVersion]);
  return null;
};
export default IsNewVersion;
