import React, { useMemo } from "react";
import { View } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import { Box } from "@ledgerhq/lumen-ui-rnative";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import TrackScreen from "~/analytics/TrackScreen";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import { ScreenHeroSectionView } from "LLM/components/ScreenHeroSection/ScreenHeroSectionView";
import { PortfolioBalanceSection } from "../../components/PortfolioBalanceSection";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import { ScreenName } from "~/const";
import { PortfolioNoSignerContent } from "../../components/PortfolioEmptySection/PortfolioNoSignerContent";
import useReadOnlyPortfolioViewModel from "./useReadOnlyPortfolioViewModel";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

function ReadOnlyPortfolioScreen({ navigation }: NavigationProps) {
  const {
    assets,
    safeAreaTop,
    shouldDisplayGraphRework,
    shouldDisplayWallet40MainNav,
    isLNSUpsellBannerShown,
    source,
    goToAssets,
    onBackFromUpdate,
  } = useReadOnlyPortfolioViewModel(navigation);

  const data = useMemo(
    () => [
      shouldDisplayGraphRework ? (
        <View key="header" style={{ paddingTop: safeAreaTop }}>
          <Flex px={6}>
            <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
          </Flex>
          <ScreenHeroSectionView>
            <PortfolioBalanceSection showAssets={false} isReadOnlyMode />
          </ScreenHeroSectionView>
        </View>
      ) : (
        <Box key="PortfolioGraphCard">
          <PortfolioGraphCard
            showAssets={false}
            screenName="Wallet"
            hideGraph={false}
            isReadOnlyMode
          />
        </Box>
      ),
      <PortfolioNoSignerContent
        key="noSigner"
        assets={assets}
        goToAssets={goToAssets}
        isLNSUpsellBannerShown={isLNSUpsellBannerShown}
      />,
    ],
    [
      shouldDisplayGraphRework,
      isLNSUpsellBannerShown,
      assets,
      goToAssets,
      onBackFromUpdate,
      safeAreaTop,
    ],
  );

  return (
    <>
      {!shouldDisplayGraphRework && (
        <Flex px={6} py={4}>
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Flex>
      )}
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <TrackScreen category="Wallet" source={source} />
      <CollapsibleHeaderFlatList<React.JSX.Element>
        data={data}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        renderItem={({ item }) => item}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        useSafeArea={!shouldDisplayWallet40MainNav}
        testID="PortfolioReadOnlyItems"
      />
    </>
  );
}

export default ReadOnlyPortfolioScreen;
