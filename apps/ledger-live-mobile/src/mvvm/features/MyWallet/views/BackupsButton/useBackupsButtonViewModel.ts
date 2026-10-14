import { track } from "@shared/analytics";
import { useCallback } from "react";
import type { SpotProps } from "@ledgerhq/lumen-ui-rnative";
import { ShieldCheck, ShieldCheckNotification } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { useRecoverEntry } from "LLM/hooks/useRecoverEntry";
import useRecoverBannerState from "LLM/features/Portfolio/hooks/useRecoverBannerState";
import { ShieldCheckNotificationIcon } from "LLM/features/BackupHub/components/ShieldCheckNotificationIcon";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";

type BackupsIcon = Extract<SpotProps, { appearance: "icon" }>["icon"];

interface BackupsButtonViewModel {
  readonly title: string;
  readonly description: string;
  readonly icon: BackupsIcon;
  readonly onPress: () => void;
}

export const useBackupsButtonViewModel = (): BackupsButtonViewModel => {
  const { t } = useTranslation();
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const { protectId, hasClickedRecover, markRecoverSeen, openRecover } = useRecoverEntry();
  const isBackupHubEnabled = !!useFeature("lwmBackupHub")?.enabled;

  const { data } = useRecoverBannerState(protectId);
  const hasCompletedBackup =
    data.subscriptionState === LedgerRecoverSubscriptionStateEnum.BACKUP_DONE;

  const hasDevice = lastConnectedDevice !== null;

  let title: string;
  if (isBackupHubEnabled || !hasDevice) {
    title = t("myWallet.walletBackups.title");
  } else {
    title = t("myWallet.quickActions.recover");
  }

  let icon: BackupsIcon;
  if (isBackupHubEnabled) {
    icon = hasCompletedBackup ? ShieldCheck : ShieldCheckNotificationIcon;
  } else {
    icon = hasClickedRecover ? ShieldCheck : ShieldCheckNotification;
  }

  const onPress = useCallback(() => {
    markRecoverSeen();
    if (isBackupHubEnabled) {
      track("button_clicked", {
        button: MY_WALLET_TRACKING_BUTTON.backup,
        page: MY_WALLET_TRACKING_PAGE_NAME,
      });
      navigation.navigate(NavigatorName.BackupHub, { screen: ScreenName.BackupHub });
      return;
    }
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.recover,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    openRecover();
  }, [navigation, markRecoverSeen, openRecover, isBackupHubEnabled]);

  return {
    title,
    description: t("myWallet.walletBackups.description"),
    icon,
    onPress,
  };
};
