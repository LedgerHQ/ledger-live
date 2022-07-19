/* eslint-disable react-native/no-inline-styles */
import React, { useCallback } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import {
  NotificationsMedium,
  NotificationsOnMedium,
  SettingsMedium,
  WarningMedium,
  CardMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { useTheme } from "styled-components/native";
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Trans } from "react-i18next";
import { Portfolio } from "@ledgerhq/live-common/portfolio/v2/types";
import { Currency } from "@ledgerhq/live-common/types/index";
import Touchable from "../../components/Touchable";
import { NavigatorName, ScreenName } from "../../const";
import { scrollToTop } from "../../navigation/utils";
import LiveLogo from "../../icons/LiveLogo";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Placeholder from "../../components/Placeholder";
import { withDiscreetMode } from "../../context/DiscreetModeContext";

function PortfolioHeader({
  currentPositionY,
  graphCardEndPosition,
  portfolio,
  counterValueCurrency,
  hidePortfolio,
}: {
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  hidePortfolio: boolean;
}) {
  const navigation = useNavigation();
  const { colors, space } = useTheme();

  const { allIds, seenIds } = useAnnouncements();
  const { incidents } = useFilteredServiceStatus();

  const onCardButtonPress = useCallback(() => {
    navigation.navigate(ScreenName.PlatformApp, {
      platform: "cl-card",
      name: "CL Card Powered by Ledger",
    });
  }, [navigation]);

  const onNotificationButtonPress = useCallback(() => {
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.NotificationCenter);
  }, [navigation]);

  const onStatusErrorButtonPress = useCallback(() => {
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenterStatus,
    });
  }, [navigation]);

  const onSettingsButtonPress = useCallback(() => {
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.Settings);
  }, [navigation]);

  const notificationsCount = allIds.length - seenIds.length;

  const TopLeftStyle = useAnimatedStyle(() => {
    const opacity =
      currentPositionY.value === 0
        ? 1
        : interpolate(
            currentPositionY.value,
            [graphCardEndPosition - 30, graphCardEndPosition],
            [1, 0],
            Extrapolate.CLAMP,
          );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  const AfterScrollTopLeftStyle = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition, graphCardEndPosition + 30],
      [0, 1],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  const isAvailable = portfolio.balanceAvailable;
  const balanceHistory = portfolio.balanceHistory;
  const currentPortfolio = balanceHistory[balanceHistory.length - 1];
  const unit = counterValueCurrency.units[0];

  return (
    <Flex flexDirection="row" alignItems="center" px={6} py={4}>
      <TouchableWithoutFeedback onPress={scrollToTop}>
        <Flex
          flexDirection={"row"}
          alignItems={"center"}
          flexGrow={1}
          flexShrink={1}
        >
          <Animated.View style={[hidePortfolio ? {} : TopLeftStyle, {}]}>
            <LiveLogo size={32} color={colors.neutral.c100} />
          </Animated.View>
          <Animated.View
            style={[
              hidePortfolio ? { opacity: 0 } : AfterScrollTopLeftStyle,
              {
                marginLeft: -32,
              },
            ]}
          >
            <Flex
              flexDirection={"column"}
              justifyContent={"center"}
              alignItems={"flex-start"}
            >
              <Text
                variant={"tiny"}
                fontWeight={"semiBold"}
                color={"neutral.c70"}
                textTransform={"uppercase"}
                mb={1}
              >
                <Trans i18nKey={"tabs.portfolio"} />
              </Text>
              {isAvailable ? (
                <Text variant={"h2"} color={"neutral.c100"}>
                  <CurrencyUnitValue
                    unit={unit}
                    value={currentPortfolio.value}
                  />
                </Text>
              ) : (
                <Placeholder width={150} containerHeight={28} />
              )}
            </Flex>
          </Animated.View>
        </Flex>
      </TouchableWithoutFeedback>
      <Box mr={7}>
        <Touchable
          onPress={onCardButtonPress}
          event="button_clicked"
          eventProperties={{
            button: "card",
            screen: ScreenName.Portfolio,
          }}
        >
          <CardMedium size={24} color={"neutral.c100"} />
        </Touchable>
      </Box>
      <Box mr={7}>
        <Touchable onPress={onNotificationButtonPress}>
          {notificationsCount > 0 ? (
            <NotificationsOnMedium size={24} color={"neutral.c100"} />
          ) : (
            <NotificationsMedium size={24} color={"neutral.c100"} />
          )}
        </Touchable>
      </Box>
      {incidents.length > 0 && (
        <Box mr={7}>
          <Touchable onPress={onStatusErrorButtonPress}>
            <WarningMedium size={24} color={"warning.c100"} />
          </Touchable>
        </Box>
      )}
      <Box>
        <Touchable onPress={onSettingsButtonPress} testID="settings-icon">
          <SettingsMedium size={24} color={"neutral.c100"} />
        </Touchable>
      </Box>
    </Flex>
  );
}

export default withDiscreetMode(PortfolioHeader);
