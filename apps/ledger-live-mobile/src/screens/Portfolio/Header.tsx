/* eslint-disable react-native/no-inline-styles */
import React, { useCallback } from "react";
import { TouchableWithoutFeedback } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import Color from "color";

import {
  NotificationsMedium,
  NotificationsOnMedium,
  SettingsMedium,
  WarningMedium,
  CardMedium,
} from "@ledgerhq/native-ui/assets/icons";
import styled, { useTheme } from "styled-components/native";
import Animated, {
  Extrapolate,
  interpolate,
  interpolateColor,
  SharedValue,
  useAnimatedStyle,
} from "react-native-reanimated";
import { Trans, useTranslation } from "react-i18next";
import { Portfolio } from "@ledgerhq/live-common/portfolio/v2/types";
import { Currency } from "@ledgerhq/live-common/types/index";
import Touchable from "../../components/Touchable";
import { NavigatorName, ScreenName } from "../../const";
import { scrollToTop } from "../../navigation/utils";
import LiveLogo from "../../icons/LiveLogo";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Placeholder from "../../components/Placeholder";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import DiscreetModeButton from "../../components/DiscreetModeButton";
import getWindowDimensions from "../../logic/getWindowDimensions";

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
  const { t } = useTranslation();

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
      [graphCardEndPosition + 100, graphCardEndPosition + 120],
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
      [graphCardEndPosition + 50, graphCardEndPosition + 120],
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
    left: -p.width / 2,
    border: "1px solid green",
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
            width: "100%",
            flexDirection: "row",
            width: windowsWidth,
            height: 92,
            backgroundColor: colors.neutral.c30,
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
            style={[WalletTitleAnimation]}
          >
            <Flex flexDirection={"row"} alignItems={"center"}>
              <Text
                variant={"small"}
                fontWeight={"semiBold"}
                color={"neutral.c100"}
                textTransform={"uppercase"}
                mr={2}
              >
                {t("tabs.portfolio")}
              </Text>
              {!hidePortfolio && <DiscreetModeButton size={20} />}
            </Flex>
          </Animated.View>
        </CenteredElement>
        <CenteredElement width={windowsWidth}>
          <Animated.View
            height={"100%"}
            justifyContent={"center"}
            background={"green"}
            style={[PortfolioValueAnimation]}
          >
            {isAvailable ? (
              <Text variant={"h2"} color={"neutral.c100"}>
                <CurrencyUnitValue unit={unit} value={currentPortfolio.value} />
              </Text>
            ) : (
              <Placeholder width={150} containerHeight={28} />
            )}
          </Animated.View>
        </CenteredElement>
      </Flex>
      {incidents.length > 0 && (
        <Box>
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
    </Header>
  );
}

export default withDiscreetMode(PortfolioHeader);

/// //

// /* eslint-disable react-native/no-inline-styles */
// import React, { useCallback } from "react";
// import { TouchableWithoutFeedback } from "react-native";
// import { useNavigation } from "@react-navigation/native";
// import { useAnnouncements } from "@ledgerhq/live-common/notifications/AnnouncementProvider/index";
// import { useFilteredServiceStatus } from "@ledgerhq/live-common/notifications/ServiceStatusProvider/index";
// import { Box, Flex, Text } from "@ledgerhq/native-ui";
// import {
//   NotificationsMedium,
//   NotificationsOnMedium,
//   SettingsMedium,
//   WarningMedium,
//   CardMedium,
// } from "@ledgerhq/native-ui/assets/icons";
// import { useTheme } from "styled-components/native";
// import Animated, {
//   Extrapolate,
//   interpolate,
//   SharedValue,
//   useAnimatedStyle,
// } from "react-native-reanimated";
// import { Trans } from "react-i18next";
// import { Portfolio } from "@ledgerhq/live-common/portfolio/v2/types";
// import { Currency } from "@ledgerhq/live-common/types/index";
// import Touchable from "../../components/Touchable";
// import { NavigatorName, ScreenName } from "../../const";
// import { scrollToTop } from "../../navigation/utils";
// import LiveLogo from "../../icons/LiveLogo";
// import CurrencyUnitValue from "../../components/CurrencyUnitValue";
// import Placeholder from "../../components/Placeholder";
// import { withDiscreetMode } from "../../context/DiscreetModeContext";

// function PortfolioHeader({
//   currentPositionY,
//   graphCardEndPosition,
//   portfolio,
//   counterValueCurrency,
//   hidePortfolio,
// }: {
//   currentPositionY: SharedValue<number>;
//   graphCardEndPosition: number;
//   portfolio: Portfolio;
//   counterValueCurrency: Currency;
//   hidePortfolio: boolean;
// }) {
//   const navigation = useNavigation();
//   const { colors, space } = useTheme();

//   const { allIds, seenIds } = useAnnouncements();
//   const { incidents } = useFilteredServiceStatus();

//   const onCardButtonPress = useCallback(() => {
//     navigation.navigate(ScreenName.PlatformApp, {
//       platform: "cl-card",
//       name: "CL Card Powered by Ledger",
//     });
//   }, [navigation]);

//   const onNotificationButtonPress = useCallback(() => {
//     // @ts-expect-error navigation ts issue
//     navigation.navigate(NavigatorName.NotificationCenter);
//   }, [navigation]);

//   const onStatusErrorButtonPress = useCallback(() => {
//     // @ts-expect-error navigation ts issue
//     navigation.navigate(NavigatorName.NotificationCenter, {
//       screen: ScreenName.NotificationCenterStatus,
//     });
//   }, [navigation]);

//   const onSettingsButtonPress = useCallback(() => {
//     // @ts-expect-error navigation ts issue
//     navigation.navigate(NavigatorName.Settings);
//   }, [navigation]);

//   const notificationsCount = allIds.length - seenIds.length;

//   const TopLeftStyle = useAnimatedStyle(() => {
//     const opacity =
//       currentPositionY.value === 0
//         ? 1
//         : interpolate(
//             currentPositionY.value,
//             [graphCardEndPosition - 30, graphCardEndPosition],
//             [1, 0],
//             Extrapolate.CLAMP,
//           );

//     return {
//       opacity,
//     };
//   }, [graphCardEndPosition]);

//   const AfterScrollTopLeftStyle = useAnimatedStyle(() => {
//     const opacity = interpolate(
//       currentPositionY.value,
//       [graphCardEndPosition, graphCardEndPosition + 30],
//       [0, 1],
//       Extrapolate.CLAMP,
//     );

//     return {
//       opacity,
//     };
//   }, [graphCardEndPosition]);

//   const isAvailable = portfolio.balanceAvailable;
//   const balanceHistory = portfolio.balanceHistory;
//   const currentPortfolio = balanceHistory[balanceHistory.length - 1];
//   const unit = counterValueCurrency.units[0];

//   return (
//     <Flex flexDirection="row" alignItems="center" px={6} py={4}>
//       <TouchableWithoutFeedback onPress={scrollToTop}>
//         <Flex
//           flexDirection={"row"}
//           alignItems={"center"}
//           flexGrow={1}
//           flexShrink={1}
//         >
//           <Animated.View style={[hidePortfolio ? {} : TopLeftStyle, {}]}>
//             <LiveLogo size={32} color={colors.neutral.c100} />
//           </Animated.View>
//           <Animated.View
//             style={[
//               hidePortfolio ? { opacity: 0 } : AfterScrollTopLeftStyle,
//               {
//                 marginLeft: -32,
//               },
//             ]}
//           >
//             <Flex
//               flexDirection={"column"}
//               justifyContent={"center"}
//               alignItems={"flex-start"}
//             >
//               <Text
//                 variant={"tiny"}
//                 fontWeight={"semiBold"}
//                 color={"neutral.c70"}
//                 textTransform={"uppercase"}
//                 mb={1}
//               >
//                 <Trans i18nKey={"tabs.portfolio"} />
//               </Text>
//               {isAvailable ? (
//                 <Text variant={"h2"} color={"neutral.c100"}>
//                   <CurrencyUnitValue
//                     unit={unit}
//                     value={currentPortfolio.value}
//                   />
//                 </Text>
//               ) : (
//                 <Placeholder width={150} containerHeight={28} />
//               )}
//             </Flex>
//           </Animated.View>
//         </Flex>
//       </TouchableWithoutFeedback>
//       <Box mr={7}>
//         <Touchable
//           onPress={onCardButtonPress}
//           event="button_clicked"
//           eventProperties={{
//             button: "card",
//             screen: ScreenName.Portfolio,
//           }}
//         >
//           <CardMedium size={24} color={"neutral.c100"} />
//         </Touchable>
//       </Box>
//       <Box mr={7}>
//         <Touchable onPress={onNotificationButtonPress}>
//           {notificationsCount > 0 ? (
//             <NotificationsOnMedium size={24} color={"neutral.c100"} />
//           ) : (
//             <NotificationsMedium size={24} color={"neutral.c100"} />
//           )}
//         </Touchable>
//       </Box>
//       {incidents.length > 0 && (
//         <Box mr={7}>
//           <Touchable onPress={onStatusErrorButtonPress}>
//             <WarningMedium size={24} color={"warning.c100"} />
//           </Touchable>
//         </Box>
//       )}
//       <Box>
//         <Touchable onPress={onSettingsButtonPress} testID="settings-icon">
//           <SettingsMedium size={24} color={"neutral.c100"} />
//         </Touchable>
//       </Box>
//     </Flex>
//   );
// }

// export default withDiscreetMode(PortfolioHeader);
