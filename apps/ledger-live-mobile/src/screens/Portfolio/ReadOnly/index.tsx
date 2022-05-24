/* eslint-disable import/named */
import React, { useCallback, useMemo, useState, memo } from "react";
import { useSelector } from "react-redux";
import { FlatList } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { isAccountEmpty } from "@ledgerhq/live-common/lib/account";

import { Box, Flex, Link as TextLink, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import proxyStyled from "@ledgerhq/native-ui/components/styled";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/lib/currencies";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useRefreshAccountsOrdering } from "../../../actions/general";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
} from "../../../reducers/settings";
import { usePortfolio } from "../../../actions/portfolio";
import globalSyncRefreshControl from "../../../components/globalSyncRefreshControl";

import GraphCardContainer from "../GraphCardContainer";
import Header from "../Header";
import TrackScreen from "../../../analytics/TrackScreen";
import { NavigatorName } from "../../../const";
import Assets from "../Assets";
import { useProviders } from "../../Swap/SwapEntry";
import CheckLanguageAvailability from "../../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../../components/CheckTermOfUseUpdate";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import BuyDeviceBanner, {
  IMAGE_PROPS_BIG_NANO,
} from "../../../components/BuyDeviceBanner";

export { default as PortfolioTabIcon } from "../TabIcon";

const AnimatedFlatListWithRefreshControl = createNativeWrapper(
  Animated.createAnimatedComponent(globalSyncRefreshControl(FlatList)),
  {
    disallowInterruption: true,
    shouldCancelWhenOutside: false,
  },
);

type Props = {
  navigation: any;
};

const StyledTouchableOpacity = proxyStyled.TouchableOpacity.attrs({
  justifyContent: "center",
  alignItems: "flex-end",
  px: 7,
  mx: -7,
  py: 5,
  my: -5,
})``;

const SectionContainer = styled(Flex).attrs((p: { px?: string | number }) => ({
  mt: 9,
  px: p.px ?? 6,
}))``;

const SectionTitle = ({
  title,
  onSeeAllPress,
  navigatorName,
  screenName,
  params,
  navigation,
  seeMoreText,
  containerProps,
}: {
  title: React.ReactElement;
  onSeeAllPress?: () => void;
  navigatorName?: string;
  screenName?: string;
  params?: any;
  navigation?: any;
  seeMoreText?: React.ReactElement;
  containerProps?: FlexBoxProps;
}) => {
  const { t } = useTranslation();
  const onLinkPress = useCallback(() => {
    if (onSeeAllPress) {
      onSeeAllPress();
    }
    if (navigation && navigatorName) {
      navigation.navigate(navigatorName, { screen: screenName, params });
    }
  }, [onSeeAllPress, navigation, navigatorName, screenName, params]);

  return (
    <Flex
      flexDirection={"row"}
      justifyContent={"space-between"}
      alignItems={"center"}
      {...containerProps}
    >
      <Text variant={"h3"} textTransform={"uppercase"} mt={2}>
        {title}
      </Text>
      {onSeeAllPress || navigatorName ? (
        <StyledTouchableOpacity onPress={onLinkPress}>
          <TextLink onPress={onLinkPress} type={"color"}>
            {seeMoreText || t("common.seeAll")}
          </TextLink>
        </StyledTouchableOpacity>
      ) : null}
    </Flex>
  );
};

const maxAssetsToDisplay = 5;

function PortfolioScreen({ navigation }: Props) {
  const { colors } = useTheme();
  const { t } = useTranslation();
  const listSupportedTokens = useCallback(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies().concat(listSupportedTokens()),
    [listSupportedTokens],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const accounts = useMemo(
    () =>
      [] || sortedCryptoCurrencies.slice(0, 10).map((currency, i) => ({
        balance: 0,
        currency,
        id: i,
        type: "Account",
      })),
    [sortedCryptoCurrencies],
  );

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );
  const portfolio = usePortfolio();
  const discreetMode = useSelector(discreetModeSelector);
  useProviders();

  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const onPortfolioCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 2);
  }, []);

  const [areAccountsEmpty] = useState(true);
  const [, assetsToDisplay] = useMemo(
    () => [accounts.length > 0, accounts.slice(0, maxAssetsToDisplay)],
    [accounts],
  );

  const bannerEventProperties = useMemo(
    () => ({
      banner: "You'll need a nano",
      button: "Buy a device",
      drawer: "transfer",
    }),
    [],
  );

  const data = useMemo(
    () => [
      <Box mx={6} mt={3} onLayout={onPortfolioCardLayout}>
        <GraphCardContainer
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          areAccountsEmpty={areAccountsEmpty}
          showGraphCard
        />
      </Box>,
      <SectionContainer>
        <SectionTitle
          title={t("distribution.title")}
          navigation={navigation}
          navigatorName={NavigatorName.PortfolioAccounts}
          containerProps={{ mb: "9px" }}
        />
        <Assets
          // balanceHistory={portfolio.balanceHistory}
          assets={assetsToDisplay}
        />
      </SectionContainer>,
      <Flex
        flex={1}
        mx={6}
        borderRadius={8}
        overflow="hidden"
      >
        <Svg style={{ position: "absolute" }} preserveAspectRatio="xMinYMin slice">
          <Defs>
            <LinearGradient
              id="myGradient"
              x1="0%"
              y1="0%"
              x2="0%"
              y2="100%"
              gradientUnits="userSpaceOnUse"
            >
              <Stop
                offset="0%"
                stopOpacity={1}
                stopColor={colors.neutral.c30}
              />
              <Stop
                offset="100%"
                stopOpacity={0}
                stopColor={colors.neutral.c30}
              />
            </LinearGradient>
          </Defs>
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#myGradient)"
          />
        </Svg>
        <Flex
          flex={1}
          px={48}
          py={60}
          alignItems="center"
          justifyContent="center"
        >
          <Text
            variant="large"
            fontWeight="semiBold"
            color="neutral.c100"
            textAlign="center"
          >
            You don't have any transactions
          </Text>
          <Text
            variant="small"
            fontWeight="medium"
            color="neutral.c70"
            textAlign="center"
            mt={3}
          >
            You'll need a device in order to buy or receive [NAME OF ASSET]
          </Text>
        </Flex>
      </Flex>,
      <BuyDeviceBanner
        style={{
          marginHorizontal: 16,
          marginTop: 40,
          paddingTop: 13.5,
          paddingBottom: 13.5,
        }}
        buttonLabel={t("buyDevice.bannerButtonTitle")}
        buttonSize="small"
        event="button_clicked"
        eventProperties={bannerEventProperties}
        {...IMAGE_PROPS_BIG_NANO}
      />,
    ],
    [
      onPortfolioCardLayout,
      counterValueCurrency,
      portfolio,
      areAccountsEmpty,
      accounts.length,
      t,
      navigation,
      assetsToDisplay,
      bannerEventProperties,
    ],
  );

  return (
    <>
      <TabBarSafeAreaView>
        <CheckLanguageAvailability />
        <CheckTermOfUseUpdate />
        <TrackScreen
          category="Portfolio"
          accountsLength={accounts.length}
          discreet={discreetMode}
        />
        <Box bg={"background.main"}>
          <Header
            counterValueCurrency={counterValueCurrency}
            portfolio={portfolio}
            currentPositionY={currentPositionY}
            graphCardEndPosition={graphCardEndPosition}
            hidePortfolio={areAccountsEmpty}
          />
        </Box>
        <AnimatedFlatListWithRefreshControl
          data={data}
          style={{ flex: 1, position: "relative" }}
          contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
          renderItem={({ item }: { item: React.ReactNode }) => item}
          keyExtractor={(_: any, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          onScroll={handleScroll}
          testID={
            accounts.length ? "PortfolioAccountsList" : "PortfolioEmptyAccount"
          }
        />
      </TabBarSafeAreaView>
    </>
  );
}

export default memo<Props>(PortfolioScreen);
