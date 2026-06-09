import { screen, track } from "~/analytics";

export const BACKUP_HUB_FEATURE_INTRO_PAGE = "Backup Hub Feature Intro";

export const trackBackupHubFeatureIntroViewed = () => {
  screen(BACKUP_HUB_FEATURE_INTRO_PAGE, undefined, {
    name: BACKUP_HUB_FEATURE_INTRO_PAGE,
    source: "backup-hub-feature-intro",
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
    source: "backup-hub-feature-intro",
    link,
  });
};

export const trackBackupHubFeatureIntroDismissed = () => {
  track("modal_dismissed", {
    page: BACKUP_HUB_FEATURE_INTRO_PAGE,
    source: "backup-hub-feature-intro",
  });
};
