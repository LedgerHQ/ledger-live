/* eslint-disable react-native/no-inline-styles */
import React, { useCallback } from "react";
import { useNavigation } from "@react-navigation/native";
import { Box, Flex, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import Animated, {
  Extrapolate,
  interpolate,
  useAnimatedStyle,
} from "react-native-reanimated";
import { useSelector } from "react-redux";
import { ArrowLeftMedium } from "@ledgerhq/native-ui/assets/icons";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import Touchable from "../../components/Touchable";
import { NavigatorName } from "../../const";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { track } from "../../analytics";
import AccountHeaderRight from "./AccountHeaderRight";
import CurrencyGradient from "../../components/CurrencyGradient";

function AccountHeader({
  currentPositionY,
  graphCardEndPosition,
  account,
}: {
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  account: Account;
}) {
  const navigation = useNavigation();
  const { colors } = useTheme();

  const readOnlyModeEnabled =
    useSelector(readOnlyModeEnabledSelector) && accounts.length <= 0;

  const onSettingsButtonPress = useCallback(() => {
    // @ts-expect-error navigation ts issue
    navigation.navigate(NavigatorName.NotificationCenter);
  }, [navigation]);

  const onBackButtonPress = useCallback(() => {
    if (readOnlyModeEnabled) {
      track("button_clicked", {
        button: "Back",
        screen: "Account",
      });
    }
    navigation.goBack();
  }, [navigation, readOnlyModeEnabled]);

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
      [graphCardEndPosition - 40, graphCardEndPosition - 30],
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
      [graphCardEndPosition - 100, graphCardEndPosition - 90],
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
            position: "absolute",
            width: windowsWidth,
            height: 92,
            overflow: "hidden",
          },
          BackgroundOpacity,
        ]}
      >
        <Box height={"100%"} width={windowsWidth}>
          <CurrencyGradient
            gradientColor={
              getCurrencyColor(account.currency) || colors.primary.c80
            }
          />
        </Box>
      </Animated.View>
      <Box>
        <Touchable onPress={onBackButtonPress}>
          <ArrowLeftMedium size={24} />
        </Touchable>
      </Box>
      <Flex flexDirection={"row"} alignItems={"center"}>
        <Text variant={"large"} fontWeight={"semiBold"}>
          {account.name}
        </Text>
      </Flex>
      <Box>
        <AccountHeaderRight />
      </Box>
    </Header>
  );
}

export default withDiscreetMode(AccountHeader);
