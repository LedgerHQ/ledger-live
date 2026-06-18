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
import { MY_WALLET_TRACKING_PAGE_NAME } from "../../constants";

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
  const { hasClickedRecover, markRecoverSeen, openRecover } = useRecoverEntry();
  const isBackupHubEnabled = !!useFeature("lwmBackupHub")?.enabled;

  const hasDevice = lastConnectedDevice !== null;
  const recoverIcon = hasClickedRecover ? ShieldCheck : ShieldCheckNotification;

  const recoverLabel = hasDevice
    ? t("myWallet.quickActions.recover")
    : t("myWallet.quickActions.backup");

  const handleRecoverPress = useCallback(() => {
    markRecoverSeen();
    track("button_clicked", { button: "Recover", page: MY_WALLET_TRACKING_PAGE_NAME });
    if (isBackupHubEnabled) {
      navigation.navigate(NavigatorName.BackupHub, { screen: ScreenName.BackupHub });
      return;
    }
    openRecover();
  }, [navigation, markRecoverSeen, openRecover, isBackupHubEnabled]);

  const handleHelpPress = useCallback(() => {
    track("button_clicked", { button: "Help", page: MY_WALLET_TRACKING_PAGE_NAME });
    navigation.navigate(NavigatorName.MyWallet, { screen: ScreenName.MyWalletHelp });
  }, [navigation]);

  const handleReferralPress = useCallback(() => {
    track("button_clicked", { button: "Referral", page: MY_WALLET_TRACKING_PAGE_NAME });
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
