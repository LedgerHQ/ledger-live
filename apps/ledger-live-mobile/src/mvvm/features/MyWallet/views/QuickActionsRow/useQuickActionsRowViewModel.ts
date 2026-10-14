import { track } from "@shared/analytics";
import { useCallback, useMemo } from "react";
import { Linking } from "react-native";
import { TileButtonProps } from "@ledgerhq/lumen-ui-rnative";
import { LifeRing, Gift } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useNavigation } from "@react-navigation/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import { useTranslation } from "~/context/Locale";
import { NavigatorName, ScreenName } from "~/const";
import { urls } from "~/utils/urls";
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
    [t, handleHelpPress, handleReferralPress],
  );

  return { actions };
};
