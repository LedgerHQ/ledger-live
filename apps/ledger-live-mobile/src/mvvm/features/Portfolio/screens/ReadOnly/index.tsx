import React, { useMemo } from "react";
import { View } from "react-native";
import { Flex } from "@ledgerhq/native-ui";
import TrackScreen from "~/analytics/TrackScreen";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import { TAB_BAR_SAFE_HEIGHT } from "~/components/TabBar/TabBarSafeAreaView";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import { ScreenHeroSectionView } from "LLM/components/ScreenHeroSection/ScreenHeroSectionView";
import { PortfolioBalanceSection } from "../../components/PortfolioBalanceSection";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PortfolioNavigatorStackParamList } from "~/components/RootNavigator/types/PortfolioNavigator";
import { ScreenName } from "~/const";
import { PortfolioNoSignerContent } from "../../components/PortfolioEmptySection/PortfolioNoSignerContent";
import { AnalyticsConsentDrawer } from "LLM/features/AnalyticsConsentDrawer";
import useReadOnlyPortfolioViewModel from "./useReadOnlyPortfolioViewModel";
import { GenericAwarenessModalDrawer } from "LLM/features/GenericAwarenessModal/screens/GenericAwarenessModalDrawer";
import { RecoverIntroPortfolioMount } from "LLM/features/BackupHub";
import { LargeScreenUpsellModalPortfolioMount } from "LLM/features/LargeScreenUpsellModal";

type NavigationProps = BaseComposite<
  StackNavigatorProps<PortfolioNavigatorStackParamList, ScreenName.Portfolio>
>;

function ReadOnlyPortfolioScreen({ navigation }: NavigationProps) {
  const { safeAreaTop, isLNSUpsellBannerShown, source, onBackFromUpdate } =
    useReadOnlyPortfolioViewModel(navigation);

  const data = useMemo(
    () => [
      <View key="header" style={{ paddingTop: safeAreaTop }}>
        <Flex px={6}>
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Flex>
        <ScreenHeroSectionView>
          <PortfolioBalanceSection showAssets={false} isReadOnlyMode />
        </ScreenHeroSectionView>
      </View>,
      <PortfolioNoSignerContent
        key="noSigner"
        isLNSUpsellBannerShown={isLNSUpsellBannerShown}
        variant="readOnly"
      />,
    ],
    [isLNSUpsellBannerShown, onBackFromUpdate, safeAreaTop],
  );

  return (
    <>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <TrackScreen category="Wallet" source={source} />
      <CollapsibleHeaderFlatList<React.JSX.Element>
        data={data}
        contentContainerStyle={{ paddingBottom: TAB_BAR_SAFE_HEIGHT }}
        renderItem={({ item }) => item}
        keyExtractor={(_: unknown, index: number) => String(index)}
        showsVerticalScrollIndicator={false}
        useSafeArea={false}
        testID="PortfolioReadOnlyItems"
      />
      <AnalyticsConsentDrawer />
      <GenericAwarenessModalDrawer />
      <RecoverIntroPortfolioMount />
      <LargeScreenUpsellModalPortfolioMount />
    </>
  );
}

export default ReadOnlyPortfolioScreen;
