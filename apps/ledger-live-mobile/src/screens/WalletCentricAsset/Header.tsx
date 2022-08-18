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
import {
  ArrowLeftMedium,
  SettingsMedium,
} from "@ledgerhq/native-ui/assets/icons";
import { getCurrencyColor } from "@ledgerhq/live-common/currencies/index";
import { useTranslation } from "react-i18next";
import Touchable from "../../components/Touchable";
import { withDiscreetMode } from "../../context/DiscreetModeContext";
import getWindowDimensions from "../../logic/getWindowDimensions";
import { readOnlyModeEnabledSelector } from "../../reducers/settings";
import { track } from "../../analytics";
import CurrencyGradient from "../../components/CurrencyGradient";
import CurrencyUnitValue from "../../components/CurrencyUnitValue";
import Placeholder from "../../components/Placeholder";

function Header({
  currentPositionY,
  graphCardEndPosition,
  currency,
  assetPortfolio,
  counterValueCurrency,
}: {
  currentPositionY: SharedValue<number>;
  graphCardEndPosition: number;
  currency: Currency;
  assetPortfolio: Portfolio;
  counterValueCurrency: Currency;
}) {
  const navigation = useNavigation();
  const { colors } = useTheme();
  const { t } = useTranslation();

  const { balanceAvailable, balanceHistory } = assetPortfolio;

  const item = balanceHistory[balanceHistory.length - 1];

  const unit = counterValueCurrency.units[0];

  const readOnlyModeEnabled =
    useSelector(readOnlyModeEnabledSelector) && accounts.length <= 0;

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
      [graphCardEndPosition + 50, graphCardEndPosition + 70],
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

  const CenteredElement = styled(Flex).attrs((p: { width?: number }) => ({
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    height: 48,
    left: -p.width / 2,
  }))`
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
            gradientColor={getCurrencyColor(currency) || colors.primary.c80}
          />
        </Box>
      </Animated.View>
      <Box>
        <Touchable onPress={onBackButtonPress}>
          <ArrowLeftMedium size={24} />
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
              {balanceAvailable ? (
                <>
                  <Text
                    variant={"small"}
                    fontWeight={"semiBold"}
                    color={"neutral.c70"}
                    fontSize="11px"
                  >
                    {t("asset.title", { assetName: currency.name })}
                  </Text>
                  <Text
                    variant={"small"}
                    fontWeight={"semiBold"}
                    color={"neutral.c100"}
                    fontSize="18px"
                  >
                    <CurrencyUnitValue
                      unit={unit}
                      value={item.value}
                      joinFragmentsSeparator=" "
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
              <Text variant={"large"} fontWeight={"semiBold"}>
                {t("asset.title", { assetName: currency.name })}
              </Text>
            </Flex>
          </Animated.View>
        </CenteredElement>
      </Flex>
      <Box>
        <Touchable onPress={() => {}}>
          <SettingsMedium size={24} />
        </Touchable>
      </Box>
    </Header>
  );
}

export default withDiscreetMode(Header);
