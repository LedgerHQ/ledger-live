/* eslint-disable import/named */
import React, { useCallback, useMemo, useState, memo } from "react";
import { useSelector } from "react-redux";
import { FlatList, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";

import { Box, Flex, Link as TextLink, Text } from "@ledgerhq/native-ui";

import styled from "styled-components/native";
import proxyStyled from "@ledgerhq/native-ui/components/styled";
import {
  isCurrencySupported,
  listSupportedCurrencies,
  listTokens,
  useCurrenciesByMarketcap,
} from "@ledgerhq/live-common/lib/currencies";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  hasOrderedNanoSelector,
  carouselVisibilitySelector,
} from "../../../reducers/settings";
import { usePortfolio } from "../../../actions/portfolio";
import globalSyncRefreshControl from "../../../components/globalSyncRefreshControl";

import ReadOnlyGraphCard from "../../../components/ReadOnlyGraphCard";
import Header from "../Header";
import TrackScreen from "../../../analytics/TrackScreen";
import { NavigatorName } from "../../../const";
import ReadOnlyAssets from "./ReadOnlyAssets";
import { useProviders } from "../../Swap/SwapEntry";
import CheckLanguageAvailability from "../../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../../components/CheckTermOfUseUpdate";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../../components/TabBar/TabBarSafeAreaView";
import BuyDeviceBanner, {
  IMAGE_PROPS_BIG_NANO,
} from "../../../components/BuyDeviceBanner";
import SetupDeviceBanner from "../../../components/SetupDeviceBanner";
import { FlexBoxProps } from "@ledgerhq/native-ui/components/Layout/Flex";
import { Currency } from "@ledgerhq/live-common/lib/types";
import { ExploreWeb3Slide } from "../../../components/Carousel/shared";

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
  const { t } = useTranslation();
  const hasOrderedNano = useSelector(hasOrderedNanoSelector);
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const showCarousel = useMemo(
    () => Object.values(carouselVisibility).some(Boolean),
    [carouselVisibility],
  );
  const listSupportedTokens = useCallback(
    () => listTokens().filter(t => isCurrencySupported(t.parentCurrency)),
    [],
  );
  const cryptoCurrencies = useMemo(
    () => listSupportedCurrencies().concat(listSupportedTokens()),
    [listSupportedTokens],
  );
  const sortedCryptoCurrencies = useCurrenciesByMarketcap(cryptoCurrencies);
  const topCryptoCurrencies = useMemo(
    () => sortedCryptoCurrencies.slice(0, maxAssetsToDisplay),
    [sortedCryptoCurrencies],
  );

  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );
  const portfolio = usePortfolio();
  const discreetMode = useSelector(discreetModeSelector);
  useProviders();

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
    () => [
      topCryptoCurrencies.length > 0,
      topCryptoCurrencies.slice(0, maxAssetsToDisplay),
    ],
    [topCryptoCurrencies],
  );

  const data = useMemo(
    () => [
      hasOrderedNano && (
        <Box mx={6} mb={5} mt={6}>
          <SetupDeviceBanner />
        </Box>
      ),
      <Box mx={6} mt={3} onLayout={onPortfolioCardLayout}>
        <ReadOnlyGraphCard
          counterValueCurrency={counterValueCurrency}
          headerText={t("tabs.portfolio")}
        />
      </Box>,
      showCarousel && hasOrderedNano && (
        <Box mt={6} mx={6}>
          <ExploreWeb3Slide />
        </Box>
      ),
      <SectionContainer>
        <SectionTitle
          title={t("distribution.title")}
          navigation={navigation}
          navigatorName={NavigatorName.PortfolioAccounts}
          containerProps={{ mb: "9px" }}
        />
        <ReadOnlyAssets assets={assetsToDisplay} />
      </SectionContainer>,
      !hasOrderedNano && (
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
          {...IMAGE_PROPS_BIG_NANO}
        />
      ),
    ],
    [
      hasOrderedNano,
      onPortfolioCardLayout,
      counterValueCurrency,
      t,
      showCarousel,
      navigation,
      assetsToDisplay,
    ],
  );

  return (
    <>
      <TabBarSafeAreaView>
        <CheckLanguageAvailability />
        <CheckTermOfUseUpdate />
        <TrackScreen
          category="Portfolio"
          accountsLength={topCryptoCurrencies.length}
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
            topCryptoCurrencies.length
              ? "PortfolioAccountsList"
              : "PortfolioEmptyAccount"
          }
        />
      </TabBarSafeAreaView>
    </>
  );
}

export default memo<Props>(PortfolioScreen);
