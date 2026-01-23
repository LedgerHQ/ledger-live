import React, { useCallback, useMemo } from "react";
import { Box, Button, Flex } from "@ledgerhq/native-ui";
import {
  Subheader,
  SubheaderRow,
  SubheaderTitle,
  SubheaderShowMore,
} from "@ledgerhq/lumen-ui-rnative";
import GraphCardContainer from "~/screens/Portfolio/GraphCardContainer";
import TrackScreen from "~/analytics/TrackScreen";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import SetupDeviceBanner from "LLM/features/Reborn/components/SetupDeviceBanner";
import BuyDeviceBanner, {
  IMAGE_PROPS_BUY_DEVICE_FLEX,
} from "LLM/features/Reborn/components/BuyDeviceBanner";
import MarketBanner from "LLM/features/MarketBanner";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import Assets from "~/screens/Portfolio/Assets";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import useReadOnlyPortfolioViewModel from "./useReadOnlyPortfolioViewModel";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

function ReadOnlyPortfolioScreen({ navigation }: NavigationProps) {
  const {
    counterValueCurrency,
    portfolio,
    hasOrderedNano,
    assets,
    graphCardEndPosition,
    currentPositionY,
    t,
    source,
    onPortfolioCardLayout,
    goToAssets,
    onBackFromUpdate,
  } = useReadOnlyPortfolioViewModel(navigation);

  const getCryptoSectionTitle = useCallback(
    (): string => `${t("wallet.tabs.crypto")} (${String(assets.length)})`,
    [t, assets.length],
  );

  const data = useMemo(
    () => [
      <Box onLayout={onPortfolioCardLayout} key="GraphCardContainer">
        <GraphCardContainer
          counterValueCurrency={counterValueCurrency}
          portfolio={portfolio}
          showGraphCard
          areAccountsEmpty={false}
          currentPositionY={currentPositionY}
          graphCardEndPosition={graphCardEndPosition}
          screenName="Wallet"
        />
      </Box>,
      ...(hasOrderedNano
        ? [
            <Box mt={7} key="SetupDeviceBanner">
              <SetupDeviceBanner screen="Wallet" />
            </Box>,
          ]
        : []),
      <Box mx={6} mt={6} key="MarketBanner">
        <MarketBanner />
      </Box>,
      <Box px={6} key="Assets">
        <Subheader>
          <SubheaderRow
            onPress={goToAssets}
            lx={{ marginBottom: "s12" }}
            accessibilityRole="button"
          >
            <SubheaderTitle>{getCryptoSectionTitle()}</SubheaderTitle>
            <SubheaderShowMore />
          </SubheaderRow>
        </Subheader>
        <Assets assets={assets} />
        <Button type="shade" size="large" outline mt={6} onPress={goToAssets}>
          {t("portfolio.seeAllAssets")}
        </Button>
      </Box>,
      ...(!hasOrderedNano
        ? [
            <Flex key="BuyDeviceBanner" mt={6} bg="transparent">
              <BuyDeviceBanner
                {...IMAGE_PROPS_BUY_DEVICE_FLEX}
                image="buyFlex"
                buttonLabel={t("buyDevice.bannerButtonTitle")}
                buttonSize="small"
                event="button_clicked"
                eventProperties={{
                  button: "Discover the Nano",
                }}
                screen="Wallet"
              />
            </Flex>,
          ]
        : []),
    ],
    [
      hasOrderedNano,
      onPortfolioCardLayout,
      counterValueCurrency,
      portfolio,
      currentPositionY,
      graphCardEndPosition,
      assets,
      goToAssets,
      t,
      getCryptoSectionTitle,
    ],
  );

  return (
    <>
      <Flex px={6} py={4}>
        <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
      </Flex>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <TrackScreen category="Wallet" source={source} />
      <CollapsibleHeaderFlatList<React.JSX.Element>
        data={data}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        renderItem={({ item }) => item}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        testID="PortfolioReadOnlyItems"
      />
    </>
  );
}

export default ReadOnlyPortfolioScreen;
