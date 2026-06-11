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
import { useSelector, useDispatch } from "~/context/hooks";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
import { lastConnectedDeviceSelector, hasClickedRecoverSelector } from "~/reducers/settings";
import { setHasClickedRecover } from "~/actions/settings";
import { track } from "~/analytics";
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
  const dispatch = useDispatch();
  const navigation =
    useNavigation<NativeStackNavigationProp<{ [key: string]: object | undefined }>>();
  const lastConnectedDevice = useSelector(lastConnectedDeviceSelector);
  const hasClickedRecover = useSelector(hasClickedRecoverSelector);
  const recoverFeature = useFeature("protectServicesMobile");
  const protectId = recoverFeature?.params?.protectId ?? "protect-prod";

  const hasDevice = lastConnectedDevice !== null;
  const recoverIcon = hasClickedRecover ? ShieldCheck : ShieldCheckNotification;

  const recoverLabel = hasDevice
    ? t("myWallet.quickActions.recover")
    : t("myWallet.quickActions.backup");

  const handleRecoverPress = useCallback(() => {
    if (!hasClickedRecover) {
      dispatch(setHasClickedRecover(true));
    }
    track("button_clicked", { button: "Recover", page: MY_WALLET_TRACKING_PAGE_NAME });
    navigation.navigate(ScreenName.Recover, {
      platform: protectId,
      device: lastConnectedDevice ?? undefined,
    });
  }, [navigation, protectId, lastConnectedDevice, hasClickedRecover, dispatch]);

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
