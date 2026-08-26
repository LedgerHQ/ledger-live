import { useCallback, useEffect, useMemo } from "react";
import { useFeature } from "@features/platform-feature-flags";
import {
  LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_UTM_CAMPAIGN,
  LARGE_SCREEN_UPSELL_UTM_MEDIUM,
  LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM,
  buildLargeScreenUpsellCtaLink,
  getNanoOnlyDeviceModel,
  isLargeScreenUpsellBannerEnabled,
} from "@features/flow-large-screen-upsell";
import { useSelector } from "LLD/hooks/redux";
import { toLargeScreenUpsellDeviceModelAnalyticsValue } from "LLD/features/LargeScreenUpsell/analytics";
import { track, trackPage } from "~/renderer/analytics/segment";
import { openURL } from "~/renderer/linking";
import { urls } from "~/config/urls";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { DEFAULT_PROTECT_ID, useRecoverBannerState } from "~/renderer/hooks/useRecoverBannerState";
import { useRecoverEntry } from "LLD/hooks/useRecoverEntry";
import {
  devicesModelListSelector,
  lastSeenDeviceSelector,
  sharePersonalizedRecommendationsSelector,
} from "~/renderer/reducers/settings";
import { getBackupBucket } from "./utils/getBackupBucket";
import {
  BACKUP_HUB_TRACKING_BUTTON,
  BACKUP_HUB_TRACKING_PAGE_NAME,
  BACKUP_HUB_UPSELL_TRACKING_BUTTON,
  BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
  BACKUP_HUB_RECOVER_DEEPLINK_QUERY,
  BACKUP_HUB_UPSELL_FALLBACK_LINK,
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
  isWarning: boolean;
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

  const devicesModelList = useSelector(devicesModelListSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const personalRecoOptIn = useSelector(sharePersonalizedRecommendationsSelector);
  const largeScreenUpsell = useFeature("largeScreenUpsell");

  const incompatibleModel = isLargeScreenUpsellBannerEnabled(
    largeScreenUpsell,
    "backup-hub-recovery-key-text-warning",
  )
    ? getNanoOnlyDeviceModel(devicesModelList, lastSeenDevice?.modelId)
    : undefined;

  const upsellLink = useMemo(() => {
    const variant = personalRecoOptIn ? "opted_in" : "opted_out";
    const configuredLink = largeScreenUpsell?.params?.[variant].link?.trim();
    return buildLargeScreenUpsellCtaLink(
      configuredLink || BACKUP_HUB_UPSELL_FALLBACK_LINK,
      "desktop",
      LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
    );
  }, [largeScreenUpsell?.params, personalRecoOptIn]);

  const upsellSharedAnalyticsProps = useMemo(
    () =>
      incompatibleModel
        ? {
            deviceModel: toLargeScreenUpsellDeviceModelAnalyticsValue(incompatibleModel),
            personalRecoOptIn,
            offerType: personalRecoOptIn ? ("discount" as const) : ("none" as const),
            platform: "lwd" as const,
          }
        : undefined,
    [incompatibleModel, personalRecoOptIn],
  );

  useEffect(() => {
    track("page_viewed", { page: BACKUP_HUB_TRACKING_PAGE_NAME });
  }, []);

  useEffect(() => {
    if (!upsellSharedAnalyticsProps) {
      return;
    }

    trackPage(
      BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
      undefined,
      {
        name: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
        ...upsellSharedAnalyticsProps,
      },
      true,
      false,
    );
  }, [upsellSharedAnalyticsProps]);

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

  const onRecoveryKeyClick = useCallback(() => {
    if (!incompatibleModel) {
      openShop(recoveryKeyUrl, BACKUP_HUB_TRACKING_BUTTON.recoveryKey);
      return;
    }

    if (!upsellSharedAnalyticsProps) {
      return;
    }

    track("button_clicked", {
      button: BACKUP_HUB_UPSELL_TRACKING_BUTTON,
      page: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
      ...upsellSharedAnalyticsProps,
    });
    track("deeplink_clicked", {
      page: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.desktop,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM_MEDIUM,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM_CAMPAIGN,
      ...upsellSharedAnalyticsProps,
    });
    openURL(upsellLink);
    onClose();
  }, [
    incompatibleModel,
    onClose,
    openShop,
    recoveryKeyUrl,
    upsellLink,
    upsellSharedAnalyticsProps,
  ]);

  const physicalRows = useMemo<readonly PhysicalRowData[]>(
    () => [
      {
        id: "recovery-key",
        image: recoveryKeyImage,
        isWarning: incompatibleModel !== undefined,
        onClick: onRecoveryKeyClick,
      },
      {
        id: "secret-recovery-phrase",
        image: secretRecoveryPhraseImage,
        isWarning: false,
        onClick: () =>
          openShop(secretRecoveryPhraseUrl, BACKUP_HUB_TRACKING_BUTTON.secretRecoveryPhrase),
      },
    ],
    [incompatibleModel, onRecoveryKeyClick, openShop, secretRecoveryPhraseUrl],
  );

  return {
    bucket,
    onBack: handleBack,
    onRecoverClick,
    physicalRows,
  };
}
