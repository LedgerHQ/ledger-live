import { useCallback, useMemo } from "react";
import { Linking, type ImageSourcePropType } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector, useDispatch } from "~/context/hooks";
import { ScreenName } from "~/const";
import { lastConnectedDeviceSelector, hasClickedRecoverSelector } from "~/reducers/settings";
import { setHasClickedRecover } from "~/actions/settings";
import { track } from "~/analytics";
import useRecoverBannerState from "LLM/features/Portfolio/hooks/useRecoverBannerState";
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

const DEFAULT_PROTECT_ID = "protect-prod";

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
  const dispatch = useDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasClickedRecover = useSelector(hasClickedRecoverSelector);
  const recoverFeature = useFeature("protectServicesMobile");
  const protectId = recoverFeature?.params?.protectId ?? DEFAULT_PROTECT_ID;

  const { data } = useRecoverBannerState(protectId);
  const bucket = getBackupBucket(data.subscriptionState);

  const onRecoverPress = useCallback(() => {
    if (!hasClickedRecover) {
      dispatch(setHasClickedRecover(true));
    }
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
    // TODO: not-subscribed should open the Feature Intro bottom-sheet; falls back to the
    // Ledger Recover screen until it is wired.
    navigation.navigate(ScreenName.Recover, {
      platform: protectId,
      device: lastConnectedDevice ?? undefined,
    });
  }, [bucket, navigation, protectId, lastConnectedDevice, hasClickedRecover, dispatch]);

  const openShop = useCallback((url: string, button: string) => {
    track("button_clicked", { button, page: BACKUP_HUB_TRACKING_PAGE_NAME });
    Linking.openURL(url);
  }, []);

  const onComparePress = useCallback(() => {
    openShop(urls.backupHub.compareAll, BACKUP_HUB_TRACKING_BUTTON.compare);
  }, [openShop]);

  const physicalRows = useMemo<readonly PhysicalRowData[]>(
    () => [
      {
        id: "recovery-key",
        image: recoveryKeyImage,
        onPress: () => openShop(urls.backupHub.recoveryKey, BACKUP_HUB_TRACKING_BUTTON.recoveryKey),
      },
      {
        id: "secret-recovery-phrase",
        image: secretRecoveryPhraseImage,
        onPress: () =>
          openShop(
            urls.backupHub.secretRecoveryPhrase,
            BACKUP_HUB_TRACKING_BUTTON.secretRecoveryPhrase,
          ),
      },
    ],
    [openShop],
  );

  return {
    bucket,
    onRecoverPress,
    onComparePress,
    physicalRows,
  };
}
