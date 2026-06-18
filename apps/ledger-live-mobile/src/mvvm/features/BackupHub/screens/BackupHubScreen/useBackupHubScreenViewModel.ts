import { useCallback, useMemo } from "react";
import { Linking, type ImageSourcePropType } from "react-native";
import { track } from "~/analytics";
import useRecoverBannerState from "LLM/features/Portfolio/hooks/useRecoverBannerState";
import { useRecoverEntry } from "LLM/hooks/useRecoverEntry";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { urls } from "~/utils/urls";
import { getBackupBucket } from "../../utils/getBackupBucket";
import {
  BACKUP_HUB_TRACKING_BUTTON,
  BACKUP_HUB_TRACKING_PAGE_NAME,
  BACKUP_HUB_RECOVER_DEEPLINK_QUERY,
  RECOVER_DEEPLINK_BASE,
} from "../../constants";
import type { BackupBucket, PhysicalRowId } from "../../types";
import recoveryKeyImage from "../../assets/recovery-key.webp";
import secretRecoveryPhraseImage from "../../assets/24-words.webp";

export type PhysicalRowData = {
  id: PhysicalRowId;
  image: ImageSourcePropType;
  onPress: () => void;
};

export type BackupHubScreenViewModel = {
  bucket: BackupBucket;
  onRecoverPress: () => void;
  onComparePress: () => void;
  physicalRows: readonly PhysicalRowData[];
};

export function useBackupHubScreenViewModel(): BackupHubScreenViewModel {
  const { protectId, markRecoverSeen, openRecover } = useRecoverEntry();

  const { data } = useRecoverBannerState(protectId);
  const bucket = getBackupBucket(data.subscriptionState);

  const recoveryKeyUrl = useLocalizedUrl(urls.backupHub.recoveryKey);
  const secretRecoveryPhraseUrl = useLocalizedUrl(urls.backupHub.secretRecoveryPhrase);
  const compareAllUrl = useLocalizedUrl(urls.backupHub.compareAll);

  const onRecoverPress = useCallback(() => {
    markRecoverSeen();
    track("button_clicked", {
      button: BACKUP_HUB_TRACKING_BUTTON.recover,
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
    });

    if (bucket === "in-progress") {
      Linking.openURL(
        `${RECOVER_DEEPLINK_BASE}/${protectId}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.inProgress}`,
      );
      return;
    }
    if (bucket === "done") {
      Linking.openURL(
        `${RECOVER_DEEPLINK_BASE}/${protectId}?${BACKUP_HUB_RECOVER_DEEPLINK_QUERY.done}`,
      );
      return;
    }
    openRecover();
  }, [bucket, protectId, markRecoverSeen, openRecover]);

  const openShop = useCallback((url: string, button: string) => {
    track("button_clicked", { button, page: BACKUP_HUB_TRACKING_PAGE_NAME });
    Linking.openURL(url);
  }, []);

  const onComparePress = useCallback(() => {
    openShop(compareAllUrl, BACKUP_HUB_TRACKING_BUTTON.compare);
  }, [openShop, compareAllUrl]);

  const physicalRows = useMemo<readonly PhysicalRowData[]>(
    () => [
      {
        id: "recovery-key",
        image: recoveryKeyImage,
        onPress: () => openShop(recoveryKeyUrl, BACKUP_HUB_TRACKING_BUTTON.recoveryKey),
      },
      {
        id: "secret-recovery-phrase",
        image: secretRecoveryPhraseImage,
        onPress: () =>
          openShop(secretRecoveryPhraseUrl, BACKUP_HUB_TRACKING_BUTTON.secretRecoveryPhrase),
      },
    ],
    [openShop, recoveryKeyUrl, secretRecoveryPhraseUrl],
  );

  return {
    bucket,
    onRecoverPress,
    onComparePress,
    physicalRows,
  };
}
