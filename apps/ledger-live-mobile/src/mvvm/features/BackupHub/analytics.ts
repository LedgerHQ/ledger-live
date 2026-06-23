import { screen, track } from "~/analytics";
import { BACKUP_HUB_TRACKING_PAGE_NAME } from "./constants";

export const BACKUP_HUB_FEATURE_INTRO_PAGE = "Ledger Recover Bottomsheet";

export const BACKUP_HUB_FEATURE_INTRO_SOURCE = BACKUP_HUB_TRACKING_PAGE_NAME;

let hasTrackedBackupHubFeatureIntroView = false;

export const resetBackupHubFeatureIntroViewTracking = () => {
  hasTrackedBackupHubFeatureIntroView = false;
};

export const trackBackupHubFeatureIntroViewed = () => {
  if (hasTrackedBackupHubFeatureIntroView) {
    return;
  }

  hasTrackedBackupHubFeatureIntroView = true;
  screen(BACKUP_HUB_FEATURE_INTRO_PAGE, undefined, {
    name: BACKUP_HUB_FEATURE_INTRO_PAGE,
    source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
  });
};

export const trackBackupHubFeatureIntroButtonClicked = ({
  button,
  link,
}: {
  button: string;
  link?: string;
}) => {
  track("button_clicked", {
    button,
    page: BACKUP_HUB_FEATURE_INTRO_PAGE,
    source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
    link,
  });
};

export const trackBackupHubFeatureIntroDismissed = () => {
  track("modal_dismissed", {
    page: BACKUP_HUB_FEATURE_INTRO_PAGE,
    source: BACKUP_HUB_FEATURE_INTRO_SOURCE,
  });
};
