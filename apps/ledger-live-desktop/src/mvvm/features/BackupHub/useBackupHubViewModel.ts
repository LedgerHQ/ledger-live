import { useCallback, useEffect, useMemo } from "react";
import { track } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { DEFAULT_PROTECT_ID, useRecoverBannerState } from "~/renderer/hooks/useRecoverBannerState";
import { useRecoverEntry } from "LLD/hooks/useRecoverEntry";
import { getBackupBucket } from "./utils/getBackupBucket";
import {
  BACKUP_HUB_TRACKING_BUTTON,
  BACKUP_HUB_TRACKING_PAGE_NAME,
  BACKUP_HUB_RECOVER_DEEPLINK_QUERY,
  RECOVER_DEEPLINK_BASE,
} from "./constants";
import type { BackupBucket, PhysicalRowId } from "./types";
import recoveryKeyImage from "./assets/recovery-key.webp";
import secretRecoveryPhraseImage from "./assets/24-words.webp";

export type BackupHubParams = {
  onBack: () => void;
  onClose: () => void;
};

export type PhysicalRowData = {
  id: PhysicalRowId;
  image: string;
  onClick: () => void;
};

export type BackupHubViewModel = {
  bucket: BackupBucket;
  onBack: () => void;
  onRecoverClick: () => void;
  physicalRows: readonly PhysicalRowData[];
};

export function useBackupHubViewModel({ onBack, onClose }: BackupHubParams): BackupHubViewModel {
  const { recoverFeature, openRecover } = useRecoverEntry();

  const protectId = recoverFeature?.params?.protectId ?? DEFAULT_PROTECT_ID;
  const { data } = useRecoverBannerState(protectId);
  const bucket = getBackupBucket(data.subscriptionState);

  const recoveryKeyUrl = useLocalizedUrl(urls.backupHub.recoveryKey);
  const secretRecoveryPhraseUrl = useLocalizedUrl(urls.backupHub.secretRecoveryPhrase);

  useEffect(() => {
    track("page_viewed", { page: BACKUP_HUB_TRACKING_PAGE_NAME });
  }, []);

  const handleBack = useCallback(() => {
    track("button_clicked", {
      button: BACKUP_HUB_TRACKING_BUTTON.back,
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
    });
    onBack();
  }, [onBack]);

  const onRecoverClick = useCallback(() => {
    track("button_clicked", {
      button: BACKUP_HUB_TRACKING_BUTTON.recover,
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
    });

    if (bucket === "in-progress") {
      openURL(
        `${RECOVER_DEEPLINK_BASE}/${protectId}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.inProgress}`,
      );
    } else if (bucket === "done") {
      openURL(`${RECOVER_DEEPLINK_BASE}/${protectId}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.done}`);
    } else {
      openRecover();
    }
    onClose();
  }, [bucket, protectId, openRecover, onClose]);

  const openShop = useCallback(
    (url: string, button: string) => {
      track("button_clicked", { button, page: BACKUP_HUB_TRACKING_PAGE_NAME });
      openURL(url);
      onClose();
    },
    [onClose],
  );

  const physicalRows = useMemo<readonly PhysicalRowData[]>(
    () => [
      {
        id: "recovery-key",
        image: recoveryKeyImage,
        onClick: () => openShop(recoveryKeyUrl, BACKUP_HUB_TRACKING_BUTTON.recoveryKey),
      },
      {
        id: "secret-recovery-phrase",
        image: secretRecoveryPhraseImage,
        onClick: () =>
          openShop(secretRecoveryPhraseUrl, BACKUP_HUB_TRACKING_BUTTON.secretRecoveryPhrase),
      },
    ],
    [openShop, recoveryKeyUrl, secretRecoveryPhraseUrl],
  );

  return {
    bucket,
    onBack: handleBack,
    onRecoverClick,
    physicalRows,
  };
}
