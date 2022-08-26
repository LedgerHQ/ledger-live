import React, { useCallback, useMemo, useState, memo } from "react";
import { useSelector } from "react-redux";
import { FlatList, LayoutChangeEvent } from "react-native";
import Animated, {
  useAnimatedScrollHandler,
  useSharedValue,
} from "react-native-reanimated";
import { createNativeWrapper } from "react-native-gesture-handler";
import { useTranslation } from "react-i18next";
import { useFocusEffect } from "@react-navigation/native";
import { isAccountEmpty } from "@ledgerhq/live-common/account/index";

import { Box, Button, Flex, Link as TextLink, Text } from "@ledgerhq/native-ui";

import styled, { useTheme } from "styled-components/native";
import proxyStyled from "@ledgerhq/native-ui/components/styled";
import { PlusMedium } from "@ledgerhq/native-ui/assets/icons";
import { useRefreshAccountsOrdering } from "../../actions/general";
import { accountsSelector } from "../../reducers/accounts";
import {
  discreetModeSelector,
  counterValueCurrencySelector,
  carouselVisibilitySelector,
} from "../../reducers/settings";
import { usePortfolio } from "../../actions/portfolio";
import globalSyncRefreshControl from "../../components/globalSyncRefreshControl";

import GraphCardContainer from "./GraphCardContainer";
import Carousel from "../../components/Carousel";
import Header from "./Header";
import TrackScreen from "../../analytics/TrackScreen";
import MigrateAccountsBanner from "../MigrateAccounts/Banner";
import { NavigatorName } from "../../const";
import FabActions from "../../components/FabActions";
import FirmwareUpdateBanner from "../../components/FirmwareUpdateBanner";
import AddAssetsCard from "./AddAssetsCard";
import Assets from "./Assets";
import { PortfolioHistoryList } from "./PortfolioHistory";
import AddAccountsModal from "../AddAccounts/AddAccountsModal";
import { useProviders } from "../Swap/SwapEntry";
import CheckLanguageAvailability from "../../components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "../../components/CheckTermOfUseUpdate";
import TabBarSafeAreaView, {
  TAB_BAR_SAFE_HEIGHT,
} from "../../components/TabBar/TabBarSafeAreaView";
import { promptBluetooth } from "../../logic/bluetoothHelper";

export { default as PortfolioTabIcon } from "./TabIcon";

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
  const carouselVisibility = useSelector(carouselVisibilitySelector);
  const showCarousel = useMemo(
    () => Object.values(carouselVisibility).some(Boolean),
    [carouselVisibility],
  );
  const accounts = useSelector(accountsSelector);
  const counterValueCurrency: Currency = useSelector(
    counterValueCurrencySelector,
  );
  const portfolio = usePortfolio();
  const discreetMode = useSelector(discreetModeSelector);
  const [isAddModalOpened, setAddModalOpened] = useState(false);
  const { colors } = useTheme();
  const openAddModal = useCallback(
    () => setAddModalOpened(true),
    [setAddModalOpened],
  );
  useProviders();

  const closeAddModal = useCallback(
    () => setAddModalOpened(false),
    [setAddModalOpened],
  );
  const refreshAccountsOrdering = useRefreshAccountsOrdering();
  useFocusEffect(refreshAccountsOrdering);

  const [graphCardEndPosition, setGraphCardEndPosition] = useState(0);
  const currentPositionY = useSharedValue(0);
  const handleScroll = useAnimatedScrollHandler(event => {
    currentPositionY.value = event.contentOffset.y;
  });

  const handlePromptPressed = useCallback(() => {
    promptBluetooth().catch(() => {});
  }, []);

  const onPortfolioCardLayout = useCallback((event: LayoutChangeEvent) => {
    const { y, height } = event.nativeEvent.layout;
    setGraphCardEndPosition(y + height / 2);
  }, []);

  const areAccountsEmpty = useMemo(
    () => accounts.every(isAccountEmpty),
    [accounts],
  );
  const [showAssets, assetsToDisplay] = useMemo(
    () => [accounts.length > 0, accounts.slice(0, maxAssetsToDisplay)],
    [accounts],
  );

  const data = useMemo(
    () => [
      !showAssets && (
        <Box mx={6} mt={3}>
          <AddAssetsCard />
        </Box>
      ),
      <Box mx={6} mt={3} onLayout={onPortfolioCardLayout}>
        <GraphCardContainer
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          areAccountsEmpty={areAccountsEmpty}
          showGraphCard={accounts.length > 0}
        />
      </Box>,
      ...(accounts.length > 0
        ? [
            <Box mt={6}>
              <FabActions areAccountsEmpty={areAccountsEmpty} />
            </Box>,
          ]
        : []),
      ...(showAssets
        ? [
            <SectionContainer>
              <SectionTitle
                title={t("distribution.title")}
                navigation={navigation}
                navigatorName={NavigatorName.PortfolioAccounts}
                containerProps={{ mb: "9px" }}
              />
              <Assets
                balanceHistory={portfolio.balanceHistory}
                assets={assetsToDisplay}
              />
              {accounts.length < maxAssetsToDisplay && (
                <>
                  <Flex
                    mt={6}
                    p={4}
                    border={`1px dashed ${colors.neutral.c40}`}
                    borderRadius={4}
                  >
                    <TextLink
                      onPress={openAddModal}
                      Icon={PlusMedium}
                      iconPosition={"left"}
                      type={"color"}
                    >
                      {t("distribution.moreAssets")}
                    </TextLink>
                  </Flex>
                  <AddAccountsModal
                    navigation={navigation}
                    isOpened={isAddModalOpened}
                    onClose={closeAddModal}
                  />
                </>
              )}
            </SectionContainer>,
          ]
        : []),
      ...(showCarousel
        ? [
            <SectionContainer px={0} minHeight={175}>
              <SectionTitle
                title={t("portfolio.recommended.title")}
                containerProps={{ mb: 7, mx: 6 }}
              />
              <Carousel cardsVisibility={carouselVisibility} />
            </SectionContainer>,
          ]
        : []),
      ...(showAssets
        ? [
            <SectionContainer px={0} mb={8}>
              <SectionTitle
                title={t("analytics.operations.title")}
                containerProps={{ mx: 6 }}
              />
              <PortfolioHistoryList navigation={navigation} />
            </SectionContainer>,
          ]
        : []),
    ],
    [
      showAssets,
      onPortfolioCardLayout,
      counterValueCurrency,
      portfolio,
      areAccountsEmpty,
      accounts.length,
      t,
      navigation,
      assetsToDisplay,
      colors.neutral.c40,
      openAddModal,
      isAddModalOpened,
      closeAddModal,
      showCarousel,
      carouselVisibility,
    ],
  );

  return (
    <>
      <TabBarSafeAreaView>
        <Flex px={6} py={4}>
          <FirmwareUpdateBanner />
        </Flex>
        <Button onPress={handlePromptPressed} type="main">
          bluetooth helper prompt
        </Button>
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
        <MigrateAccountsBanner />
      </TabBarSafeAreaView>
    </>
  );
}

export default memo<Props>(PortfolioScreen);
