import { useCallback, useEffect, useMemo } from "react";
import { Linking, type ImageSourcePropType } from "react-native";
import { getNanoOnlyDeviceModel } from "@features/flow-large-screen-upsell/utils/getNanoOnlyDeviceModel";
import { isLargeScreenUpsellBannerEnabled } from "@features/flow-large-screen-upsell/utils/isLargeScreenUpsellBannerEnabled";
import {
  LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
  LARGE_SCREEN_UPSELL_UTM_CAMPAIGN,
  LARGE_SCREEN_UPSELL_UTM_MEDIUM,
  LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM,
  buildLargeScreenUpsellCtaLink,
} from "@features/flow-large-screen-upsell/utils/upsellCta";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { useCustomURI } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
import { useFeature } from "@features/platform-feature-flags";
import {
  toLargeScreenUpsellDeviceModelAnalyticsValue,
  type LargeScreenUpsellNanoDeviceModelId,
} from "LLM/features/LargeScreenUpsell/analytics";
import { screen, track } from "~/analytics";
import useRecoverBannerState from "LLM/features/Portfolio/hooks/useRecoverBannerState";
import { useRecoverEntry } from "LLM/hooks/useRecoverEntry";
import { useLocalizedUrl } from "LLM/hooks/useLocalizedUrls";
import { useSelector } from "~/context/hooks";
import {
  knownDeviceModelIdsSelector,
  lastSeenDeviceSelector,
  personalizedRecommendationsEnabledSelector,
} from "~/reducers/settings";
import { urls } from "~/utils/urls";
import { getBackupBucket } from "../../utils/getBackupBucket";
import {
  BACKUP_HUB_TRACKING_BUTTON,
  BACKUP_HUB_TRACKING_PAGE_NAME,
  BACKUP_HUB_UPSELL_TRACKING_BUTTON,
  BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
  BACKUP_HUB_RECOVER_DEEPLINK_QUERY,
  BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK,
  BACKUP_HUB_RECOVER_TRACKING_STATUS,
  BACKUP_HUB_UPSELL_FALLBACK_LINK,
  RECOVER_DEEPLINK_BASE,
} from "../../constants";
import type { BackupBucket, PhysicalRowId } from "../../types";
import recoveryKeyImage from "../../assets/recovery-key.webp";
import secretRecoveryPhraseImage from "../../assets/24-words.webp";

export type PhysicalRowData = {
  id: PhysicalRowId;
  image: ImageSourcePropType;
  isWarning: boolean;
  onPress: () => void;
};

export type BackupHubScreenViewModel = {
  bucket: BackupBucket;
  onRecoverPress: () => void;
  onComparePress: () => void;
  physicalRows: readonly PhysicalRowData[];
};

export function useBackupHubScreenViewModel(): BackupHubScreenViewModel {
  const { protectId, markRecoverSeen } = useRecoverEntry();
  const recoverServices = useFeature("protectServicesMobile");
  const recoverOneMonthFreeLink = useCustomURI(
    recoverServices,
    BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.redirectTo,
    BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.source,
    BACKUP_HUB_RECOVER_ONE_MONTH_FREE_DEEPLINK.campaign,
  );

  const { data } = useRecoverBannerState(protectId);
  const bucket = getBackupBucket(data.subscriptionState);

  const recoveryKeyUrl = useLocalizedUrl(urls.backupHub.recoveryKey);
  const secretRecoveryPhraseUrl = useLocalizedUrl(urls.backupHub.secretRecoveryPhrase);
  const compareAllUrl = useLocalizedUrl(urls.backupHub.compareAll);

  const knownDeviceModelIds = useSelector(knownDeviceModelIdsSelector);
  const lastSeenDevice = useSelector(lastSeenDeviceSelector);
  const personalRecoOptIn = useSelector(personalizedRecommendationsEnabledSelector);
  const largeScreenUpsell = useFeature("largeScreenUpsell");

  const devicesModelList = useMemo(
    () =>
      (Object.keys(knownDeviceModelIds) as DeviceModelId[]).filter(id => knownDeviceModelIds[id]),
    [knownDeviceModelIds],
  );

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
      "mobile",
      LARGE_SCREEN_UPSELL_BACKUPS_UTM_CONTENT,
    );
  }, [largeScreenUpsell?.params, personalRecoOptIn]);

  const upsellSharedAnalyticsProps = useMemo(
    () =>
      incompatibleModel
        ? {
            deviceModel: toLargeScreenUpsellDeviceModelAnalyticsValue(
              incompatibleModel as LargeScreenUpsellNanoDeviceModelId,
            ),
            personalRecoOptIn,
            offerType: personalRecoOptIn ? ("discount" as const) : ("none" as const),
            platform: "lwm" as const,
          }
        : undefined,
    [incompatibleModel, personalRecoOptIn],
  );

  useEffect(() => {
    if (!upsellSharedAnalyticsProps) {
      return;
    }

    screen(
      BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
      undefined,
      {
        name: BACKUP_HUB_UPSELL_TRACKING_PAGE_NAME,
        ...upsellSharedAnalyticsProps,
      },
      false,
    );
  }, [upsellSharedAnalyticsProps]);

  const onRecoverPress = useCallback(() => {
    markRecoverSeen();
    track("button_clicked", {
      button: BACKUP_HUB_TRACKING_BUTTON.recover,
      page: BACKUP_HUB_TRACKING_PAGE_NAME,
      status: BACKUP_HUB_RECOVER_TRACKING_STATUS[bucket],
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
    if (!recoverOneMonthFreeLink) {
      return;
    }
    Linking.openURL(recoverOneMonthFreeLink);
  }, [bucket, protectId, markRecoverSeen, recoverOneMonthFreeLink]);

  const openShop = useCallback((url: string, button: string) => {
    track("button_clicked", { button, page: BACKUP_HUB_TRACKING_PAGE_NAME });
    Linking.openURL(url);
  }, []);

  const onComparePress = useCallback(() => {
    openShop(compareAllUrl, BACKUP_HUB_TRACKING_BUTTON.compare);
  }, [openShop, compareAllUrl]);

  const onRecoveryKeyPress = useCallback(() => {
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
      deeplinkSource: LARGE_SCREEN_UPSELL_UTM_SOURCE_BY_PLATFORM.mobile,
      deeplinkMedium: LARGE_SCREEN_UPSELL_UTM_MEDIUM,
      deeplinkCampaign: LARGE_SCREEN_UPSELL_UTM_CAMPAIGN,
      ...upsellSharedAnalyticsProps,
    });
    Linking.openURL(upsellLink);
  }, [incompatibleModel, openShop, recoveryKeyUrl, upsellLink, upsellSharedAnalyticsProps]);

  const physicalRows = useMemo<readonly PhysicalRowData[]>(
    () => [
      {
        id: "recovery-key",
        image: recoveryKeyImage,
        isWarning: incompatibleModel !== undefined,
        onPress: onRecoveryKeyPress,
      },
      {
        id: "secret-recovery-phrase",
        image: secretRecoveryPhraseImage,
        isWarning: false,
        onPress: () =>
          openShop(secretRecoveryPhraseUrl, BACKUP_HUB_TRACKING_BUTTON.secretRecoveryPhrase),
      },
    ],
    [incompatibleModel, onRecoveryKeyPress, openShop, secretRecoveryPhraseUrl],
  );

  return {
    bucket,
    onRecoverPress,
    onComparePress,
    physicalRows,
  };
}
