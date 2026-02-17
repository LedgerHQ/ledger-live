import React, { useCallback, useMemo } from "react";
import { useNavigation } from "@react-navigation/native";
import { Flex, Text } from "@ledgerhq/native-ui";
import { useFeature, useWalletFeaturesConfig } from "@ledgerhq/live-common/featureFlags/index";
import { CardMedium, SettingsMedium, WalletConnectMedium } from "@ledgerhq/native-ui/assets/icons";
import { useTranslation } from "~/context/Locale";
import { useTheme } from "styled-components/native";
import { NativeStackNavigationProp } from "@react-navigation/native-stack";
import Touchable from "~/components/Touchable";
import { NavigatorName, ScreenName } from "~/const";
import { withDiscreetMode } from "~/context/DiscreetModeContext";
import DiscreetModeButton from "~/components/DiscreetModeButton";
import { track } from "~/analytics";
import useDynamicContent from "~/dynamicContent/useDynamicContent";
import Notifications from "~/icons/Notifications";

const NotificationsButton = () => {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { notificationCards } = useDynamicContent();

  const onNotificationButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "notification bell",
      page: ScreenName.Portfolio,
    });
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenter,
    });
  }, [navigation]);

  const notificationsCount = useMemo(
    () => notificationCards.length - notificationCards.filter(n => n.viewed).length,
    [notificationCards],
  );
  return (
    <Touchable onPress={onNotificationButtonPress}>
      <Notifications
        size={24}
        color={colors.neutral.c100}
        dotColor={colors.error.c40}
        isOn={notificationsCount > 0}
      />
    </Touchable>
  );
};

function PortfolioHeader({ hidePortfolio }: { hidePortfolio: boolean }) {
  const navigation = useNavigation();

  const { t } = useTranslation();
  const ptxCardFlag = useFeature("ptxCard");
  const { isEnabled: isNewPortfolioEnabled } = useWalletFeaturesConfig("mobile");

  const onNavigate = useCallback(
    (name: string, options?: object) => {
      (navigation as NativeStackNavigationProp<{ [key: string]: object | undefined }>).navigate(
        name,
        options,
      );
    },
    [navigation],
  );

  const onWalletConnectPress = useCallback(
    () =>
      onNavigate(NavigatorName.WalletConnect, {
        screen: ScreenName.WalletConnectConnect,
      }),
    [onNavigate],
  );

  const onSettingsButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Settings",
    });
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.Settings);
  }, [navigation]);

  const onSideImageCardButtonPress = useCallback(() => {
    if (ptxCardFlag?.enabled) {
      navigation.navigate(NavigatorName.Card, {
        screen: ScreenName.Card,
      });
    } else {
      navigation.navigate(ScreenName.PlatformApp, {
        platform: "cl-card",
        name: "CL Card Powered by Ledger",
      });
    }
  }, [navigation, ptxCardFlag]);

  return (
    <Flex
      flexDirection="row"
      alignItems="center"
      justifyContent="space-between"
      style={{ zIndex: 10 }}
    >
      <Flex flexDirection={"row"} alignItems={"center"} mr={3} flexShrink={1} flexGrow={1}>
        <Text
          variant={"h4"}
          fontWeight={"semiBold"}
          color={"neutral.c100"}
          flexGrow={0}
          flexShrink={1}
          textAlign="center"
          mr={3}
          numberOfLines={1}
        >
          {t("tabs.portfolio")}
        </Text>
        {!hidePortfolio && !isNewPortfolioEnabled && <DiscreetModeButton size={20} />}
      </Flex>
      <Flex flexDirection="row">
        <Flex mr={7}>
          <Touchable
            onPress={onSideImageCardButtonPress}
            event="button_clicked"
            eventProperties={{
              button: "card",
              page: ScreenName.Portfolio,
            }}
          >
            <CardMedium size={24} color={"neutral.c100"} />
          </Touchable>
        </Flex>

        <Flex mr={7}>
          <Touchable
            onPress={onWalletConnectPress}
            event="button_clicked"
            eventProperties={{
              button: "Wallet Connect",
              page: ScreenName.WalletConnectConnect,
            }}
          >
            <WalletConnectMedium size={24} color={"neutral.c100"} />
          </Touchable>
        </Flex>

        <Flex mr={7}>
          <NotificationsButton />
        </Flex>
        <Touchable onPress={onSettingsButtonPress} testID="settings-icon">
          <SettingsMedium size={24} color={"neutral.c100"} />
        </Touchable>
      </Flex>
    </Flex>
  );
}

export default withDiscreetMode(PortfolioHeader);
