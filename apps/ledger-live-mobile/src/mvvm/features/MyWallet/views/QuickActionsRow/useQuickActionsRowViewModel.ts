import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { TileButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { ShieldCheckNotification, LifeRing, Gift } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import useFeature from "@ledgerhq/live-common/featureFlags/useFeature";
import { useSelector } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { ScreenName } from "~/const";
import { track } from "~/analytics";
import { urls } from "~/utils/urls";
import { lastConnectedDeviceSelector } from "~/reducers/settings";

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
  const recoverFeature = useFeature("protectServicesMobile");
  const protectId = recoverFeature?.params?.protectId ?? "protect-prod";

  const hasDevice = lastConnectedDevice !== null;

  const recoverLabel = hasDevice
    ? t("myWallet.quickActions.recover")
    : t("myWallet.quickActions.backup");

  const handleRecoverPress = useCallback(() => {
    track("button_clicked", { button: "Recover", page: ScreenName.MyWallet });
    navigation.navigate(ScreenName.Recover, {
      platform: protectId,
      device: lastConnectedDevice ?? undefined,
    });
  }, [navigation, protectId, lastConnectedDevice]);

  const handleHelpPress = useCallback(() => {
    // TODO: implement help navigation
  }, []);

  const handleReferralPress = useCallback(() => {
    track("button_clicked", { button: "Referral", page: ScreenName.MyWallet });
    Linking.openURL(urls.referralProgram);
  }, []);

  const actions: readonly QuickActionRowItem[] = useMemo(
    () => [
      {
        id: "recover",
        label: recoverLabel,
        icon: ShieldCheckNotification,
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
    [t, recoverLabel, handleRecoverPress, handleHelpPress, handleReferralPress],
  );

  return { actions };
};
