import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { TileButtonProps } from "@ledgerhq/lumen-ui-rnative";
import {
  ShieldCheck,
  ShieldCheckNotification,
  LifeRing,
  Gift,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useFeature } from "@features/platform-feature-flags";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { lastConnectedDeviceSelector } from "~/reducers/settings";
import { track } from "~/analytics";
import { useRecoverEntry } from "LLM/hooks/useRecoverEntry";
import useRecoverBannerState from "LLM/features/Portfolio/hooks/useRecoverBannerState";
import { ShieldCheckNotificationIcon } from "LLM/features/BackupHub/components/ShieldCheckNotificationIcon";
import { LedgerRecoverSubscriptionStateEnum } from "~/types/recoverSubscriptionState";
import { MY_WALLET_TRACKING_BUTTON, MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";

export interface QuickActionRowItem {
  readonly id: string;
  readonly label: string;
  readonly icon: TileButtonProps["icon"];
  readonly onPress: () => void;
  readonly testID: string;
}

interface QuickActionsRowViewModel {
  readonly actions: readonly QuickActionRowItem[];
}

export const useQuickActionsRowViewModel = (): QuickActionsRowViewModel => {
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

  let recoverLabel: string;
  if (isBackupHubEnabled || !hasDevice) {
    recoverLabel = t("myWallet.quickActions.backup");
  } else {
    recoverLabel = t("myWallet.quickActions.recover");
  }

  let recoverIcon: TileButtonProps["icon"];
  if (isBackupHubEnabled) {
    recoverIcon = hasCompletedBackup ? ShieldCheck : ShieldCheckNotificationIcon;
  } else {
    recoverIcon = hasClickedRecover ? ShieldCheck : ShieldCheckNotification;
  }

  const handleRecoverPress = useCallback(() => {
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

  const handleHelpPress = useCallback(() => {
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.help,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    navigation.navigate(NavigatorName.MyWallet, { screen: ScreenName.MyWalletHelp });
  }, [navigation]);

  const handleReferralPress = useCallback(() => {
    track("button_clicked", {
      button: MY_WALLET_TRACKING_BUTTON.referral,
      page: MY_WALLET_TRACKING_PAGE_NAME,
    });
    Linking.openURL(urls.referralProgram);
  }, []);

  const actions: readonly QuickActionRowItem[] = useMemo(
    () => [
      {
        id: "recover",
        label: recoverLabel,
        icon: recoverIcon,
        onPress: handleRecoverPress,
        testID: "my-wallet-quick-action-recover",
      },
      {
        id: "help",
        label: t("myWallet.quickActions.help"),
        icon: LifeRing,
        onPress: handleHelpPress,
        testID: "my-wallet-quick-action-help",
      },
      {
        id: "referral",
        label: t("myWallet.quickActions.referral"),
        icon: Gift,
        onPress: handleReferralPress,
        testID: "my-wallet-quick-action-referral",
      },
    ],
    [t, recoverLabel, recoverIcon, handleRecoverPress, handleHelpPress, handleReferralPress],
  );

  return { actions };
};
