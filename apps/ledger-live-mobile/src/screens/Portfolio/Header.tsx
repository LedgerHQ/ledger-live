import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Box, Flex, Text } from "@ledgerhq/native-ui";

import {
  NotificationsMedium,
  NotificationsOnMedium,
  SettingsMedium,
  WarningMedium,
} from "@ledgerhq/native-ui/assets/icons";
import styled, { useTheme } from "styled-components/native";
import Animated, {
  Extrapolate,
  interpolate,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useTranslation } from "react-i18next";
import { Portfolio } from "@ledgerhq/types-live";
import { Currency } from "@ledgerhq/types-cryptoassets";
import Touchable from "../../components/Touchable";
import { NavigatorName, ScreenName } from "../../const";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Placeholder from "../../components/Placeholder";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import DiscreetModeButton from "../../components/DiscreetModeButton";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { track } from "../../analytics";
import { useCurrentRouteName } from "../../helpers/routeHooks";

function PortfolioHeader({
  currentPositionY,
  graphCardEndPosition,
  portfolio,
  counterValueCurrency,
  hidePortfolio,
}: {
  currentPositionY: Animated.SharedValue<number>;
  graphCardEndPosition: number;
  portfolio: Portfolio;
  counterValueCurrency: Currency;
  hidePortfolio: boolean;
}) {
  const navigation = useNavigation();
  const currentRoute = useCurrentRouteName();
  const { colors } = useTheme();

  const { allIds, seenIds } = useAnnouncements();
  const { incidents } = useFilteredServiceStatus();
  const { t } = useTranslation();

  const onNotificationButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Notification Center",
      screen: currentRoute,
    });
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.NotificationCenter);
  }, [navigation, currentRoute]);

  const onStatusErrorButtonPress = useCallback(() => {
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.NotificationCenter, {
      screen: ScreenName.NotificationCenterStatus,
    });
  }, [navigation]);
  const onSettingsButtonPress = useCallback(() => {
    track("button_clicked", {
      button: "Settings",
      screen: currentRoute,
    });
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.Settings);
  }, [currentRoute, navigation]);

  const notificationsCount = allIds.length - seenIds.length;

  const WalletTitleAnimation = useAnimatedStyle(() => {
    const opacity =
      currentPositionY.value === 0
        ? 1
        : interpolate(
            currentPositionY.value,
            [graphCardEndPosition - 40, graphCardEndPosition],
            [1, 0],
            Extrapolate.CLAMP,
          );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  const PortfolioValueAnimation = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition + 110, graphCardEndPosition + 120],
      [0, 1],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  const BackgroundOpacity = useAnimatedStyle(() => {
    const opacity = interpolate(
      currentPositionY.value,
      [graphCardEndPosition + 80, graphCardEndPosition + 100],
      [0, 1],
      Extrapolate.CLAMP,
    );

    return {
      opacity,
    };
  }, [graphCardEndPosition]);

  const Header = styled(Flex)`
    position: absolute;
  `;

  const CenteredElement = styled(Flex).attrs((p: { width?: number }) => ({
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    left: -p.width / 2 + p.width * 0.15,
    width: p.width * 0.7,
  }))`
    position: absolute;
  `;

  const isAvailable = portfolio.balanceAvailable;
  const balanceHistory = portfolio.balanceHistory;
  const currentPortfolio = balanceHistory[balanceHistory.length - 1];
  const unit = counterValueCurrency.units[0];

  const windowsWidth = getWindowDimensions().width;
  return (
    <Header
      flexDirection="row"
      alignItems="center"
      px={6}
      py={4}
      justifyContent="space-between"
      width={windowsWidth}
      height={92}
      pt={44}
    >
      <Animated.View
        style={[
          {
            display: "flex",
            position: "absolute",
            flexDirection: "row",
            width: windowsWidth,
            height: 92,
            backgroundColor: colors.background.drawer,
          },
          BackgroundOpacity,
        ]}
      />
      <Box>
        <Touchable onPress={onNotificationButtonPress}>
          {notificationsCount > 0 ? (
            <NotificationsOnMedium size={24} color={"neutral.c100"} />
          ) : (
            <NotificationsMedium size={24} color={"neutral.c100"} />
          )}
        </Touchable>
      </Box>
      <Flex flexDirection={"row"} alignItems={"center"}>
        <CenteredElement width={windowsWidth}>
          <Animated.View
            height={"100%"}
            justifyContent={"center"}
            style={[PortfolioValueAnimation]}
          >
            <Flex flexDirection={"column"} alignItems={"center"}>
              {balanceHistory ? (
                <>
                  <Text
                    variant={"small"}
                    fontWeight={"semiBold"}
                    color={"neutral.c70"}
                    fontSize="11px"
                  >
                    {t("portfolio.walletBalance")}
                  </Text>
                  <Text
                    variant={"small"}
                    fontWeight={"semiBold"}
                    color={"neutral.c100"}
                    fontSize="18px"
                  >
                    <CurrencyUnitValue
                      unit={unit}
                      value={currentPortfolio.value}
                    />
                  </Text>
                </>
              ) : (
                <>
                  <Placeholder width={100} containerHeight={18} />
                  <Placeholder width={150} containerHeight={28} />
                </>
              )}
            </Flex>
          </Animated.View>
        </CenteredElement>
        <CenteredElement width={windowsWidth}>
          <Animated.View
            height={"100%"}
            justifyContent={"center"}
            style={[WalletTitleAnimation]}
          >
            <Flex flexDirection={"row"} alignItems={"center"}>
              <Text
                variant={"small"}
                fontWeight={"semiBold"}
                color={"neutral.c100"}
                fontSize="16px"
                mr={2}
              >
                {t("portfolio.walletBalance")}
              </Text>
              {!hidePortfolio && <DiscreetModeButton size={20} />}
              {incidents.length > 0 && (
                <Box pl={2}>
                  <Touchable onPress={onStatusErrorButtonPress}>
                    <WarningMedium size={24} color={"warning.c100"} />
                  </Touchable>
                </Box>
              )}
            </Flex>
          </Animated.View>
        </CenteredElement>
      </Flex>
      <Box>
        <Touchable onPress={onSettingsButtonPress} testID="settings-icon">
          <SettingsMedium size={24} color={"neutral.c100"} />
        </Touchable>
      </Box>
    </Header>
  );
}

export default withDiscreetMode(PortfolioHeader);
