import React, { useMemo } from "react";
import { Platform } from "react-native";
import Animated from "react-native-reanimated";

import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "LLM/features/WalletV4Tour/Drawer";
import { renderItem } from "LLM/utils/renderItem";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import usePortfolioViewModel from "./usePortfolioViewModel";

import { Box } from "@ledgerhq/native-ui";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";

import {
  PortfolioAllocationsSection,
  PortfolioAssetsSection,
  PortfolioCarouselSection,
  PortfolioEmptySection,
  PortfolioHeaderSection,
  PortfolioOperationsSection,
  PortfolioBannersSection,
} from "../../components";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(CollapsibleHeaderFlatList, {
  progressViewOffset: Platform.OS === "android" ? 64 : 0,
});

export const PortfolioScreen = ({ navigation }: NavigationProps) => {
  const {
    hideEmptyTokenAccount,
    isAWalletCardDisplayed,
    isAccountListUIEnabled,
    shouldDisplayQuickActionCtas,
    showAssets,
    isLNSUpsellBannerShown,
    isAddModalOpened,
    shouldDisplayGraphRework,
    backgroundColor,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
    goToAnalyticsAllocations,
  } = usePortfolioViewModel(navigation);

  const { isDrawerOpen, handleCloseDrawer } = useWalletV4TourDrawer();

  const data = useMemo(() => {
    const sections: React.JSX.Element[] = [];

    sections.push(
      <PortfolioHeaderSection
        key="header"
        showAssets={showAssets}
        hideGraph={shouldDisplayGraphRework}
        onBackFromUpdate={onBackFromUpdate}
      />,
    );

    if (!showAssets) {
      sections.push(
        <PortfolioEmptySection key="empty" isLNSUpsellBannerShown={isLNSUpsellBannerShown} />,
      );
      return sections;
    }

    if (shouldDisplayQuickActionCtas) {
      sections.push(
        <Box px={6} pt={shouldDisplayGraphRework ? 0 : 6} key="quickActions">
          <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
          <TransferDrawer />
        </Box>,
      );
    }

    sections.push(
      <PortfolioBannersSection
        key="banners"
        isFirst={true}
        isLNSUpsellBannerShown={isLNSUpsellBannerShown}
        showAssets={showAssets}
      />,
    );

    sections.push(
      <PortfolioAssetsSection
        key="assets"
        isAccountListUIEnabled={isAccountListUIEnabled}
        hideEmptyTokenAccount={hideEmptyTokenAccount}
        openAddModal={openAddModal}
        onHeightChange={handleHeightChange}
      />,
    );

    if (isAWalletCardDisplayed) {
      sections.push(<PortfolioCarouselSection key="carousel" backgroundColor={backgroundColor} />);
    }

    if (!shouldDisplayGraphRework) {
      sections.push(
        <PortfolioAllocationsSection
          key="allocations"
          isFirst={!isAWalletCardDisplayed}
          onPress={goToAnalyticsAllocations}
        />,
      );
    }

    sections.push(<PortfolioOperationsSection key="operations" />);

    return sections;
  }, [
    showAssets,
    shouldDisplayGraphRework,
    onBackFromUpdate,
    isLNSUpsellBannerShown,
    shouldDisplayQuickActionCtas,
    isAccountListUIEnabled,
    hideEmptyTokenAccount,
    openAddModal,
    handleHeightChange,
    isAWalletCardDisplayed,
    backgroundColor,
    goToAnalyticsAllocations,
  ]);

  return (
    <>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <Animated.View style={{ flex: 1 }}>
        <RefreshableCollapsibleHeaderFlatList
          data={data}
          renderItem={renderItem<React.JSX.Element>}
          keyExtractor={(_: unknown, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          testID={showAssets ? "PortfolioAccountsList" : "PortfolioEmptyList"}
        />
        <AddAccountDrawer
          isOpened={isAddModalOpened}
          onClose={closeAddModal}
          doesNotHaveAccount={!showAssets}
        />
      </Animated.View>
      <WalletV4TourDrawer isDrawerOpen={isDrawerOpen} handleCloseDrawer={handleCloseDrawer} />
    </>
  );
};
