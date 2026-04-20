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
import { AnalyticsConsentDrawer } from "LLM/features/AnalyticsConsentDrawer";
import {
  PROGRESS_VIEW_OFFSET_LEGACY_ANDROID,
  PROGRESS_VIEW_OFFSET_LEGACY_IOS,
} from "../../constants";
import { getProgressViewOffset } from "../../utils/getProgressViewOffset";
import usePortfolioViewModel from "./usePortfolioViewModel";
import { useScrollToTop } from "./useScrollToTop";

import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";

import {
  PortfolioAllocationsSection,
  PortfolioAssetsSection,
  WalletAssetsView,
  PortfolioCarouselSection,
  PortfolioEmptySection,
  PortfolioHeaderSection,
  PortfolioOperationsSection,
  PortfolioBannersSection,
  PortfolioPerpsEntryPoint,
  PortfolioLoansSection,
} from "../../components";
import { Box } from "@ledgerhq/native-ui";
type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(CollapsibleHeaderFlatList, {
  progressViewOffset:
    Platform.OS === "android"
      ? PROGRESS_VIEW_OFFSET_LEGACY_ANDROID
      : PROGRESS_VIEW_OFFSET_LEGACY_IOS,
});

export const PortfolioScreen = ({ navigation }: NavigationProps) => {
  const {
    hideEmptyTokenAccount,
    isAWalletCardDisplayed,
    isAccountListUIEnabled,
    shouldDisplayQuickActionCtas,
    shouldDisplayAssetSection,
    shouldDisplayLoansSection,
    shouldDisplayMarketBanner,
    showAssets,
    isLNSUpsellBannerShown,
    isAddModalOpened,
    shouldDisplayGraphRework,
    backgroundColor,
    isSyncError,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
    goToAnalyticsAllocations,
    shouldDisplayWallet40MainNav,
    shouldDisplayOperationsList,
    shouldAddBottomPaddingForLegacyAssets,
  } = usePortfolioViewModel(navigation);

  const progressViewOffset = getProgressViewOffset(Platform.OS, shouldDisplayWallet40MainNav);

  const { handleFlatListRef } = useScrollToTop();

  const { isDrawerOpen, handleCloseDrawer, closeDrawer, onSlideChange, slides } =
    useWalletV4TourDrawer();

  const data = useMemo(() => {
    const sections: React.JSX.Element[] = [];

    const heroCtasNode =
      showAssets && shouldDisplayQuickActionCtas && shouldDisplayGraphRework ? (
        <>
          <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
          <TransferDrawer />
        </>
      ) : undefined;

    sections.push(
      <PortfolioHeaderSection
        key="header"
        showAssets={showAssets}
        hideGraph={shouldDisplayGraphRework}
        onBackFromUpdate={onBackFromUpdate}
        ctas={heroCtasNode}
      />,
    );

    if (!showAssets) {
      sections.push(
        <PortfolioEmptySection key="empty" isLNSUpsellBannerShown={isLNSUpsellBannerShown} />,
      );
      return sections;
    }

    if (shouldDisplayQuickActionCtas && !shouldDisplayGraphRework) {
      sections.push(
        <Box px={6} pt={6} key="quickActions">
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

    if (shouldDisplayMarketBanner) {
      sections.push(
        <Box key="marketBanner" px={6} pt={6}>
          <MarketBanner />
        </Box>,
      );
    }

    sections.push(<PortfolioPerpsEntryPoint key="perpsEntryPoint" />);

    if (shouldDisplayAssetSection) {
      sections.push(<WalletAssetsView key="categorizedAssets" />);
    } else {
      sections.push(
        <PortfolioAssetsSection
          key="assets"
          isAccountListUIEnabled={isAccountListUIEnabled}
          hideEmptyTokenAccount={hideEmptyTokenAccount}
          openAddModal={openAddModal}
          onHeightChange={handleHeightChange}
          shouldAddBottomPadding={shouldAddBottomPaddingForLegacyAssets}
        />,
      );
    }

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

    if (shouldDisplayLoansSection) {
      sections.push(<PortfolioLoansSection key="loans" />);
    }

    if (!shouldDisplayOperationsList) {
      sections.push(<PortfolioOperationsSection key="operations" />);
    }

    return sections;
  }, [
    showAssets,
    shouldDisplayGraphRework,
    shouldDisplayAssetSection,
    shouldDisplayLoansSection,
    shouldDisplayMarketBanner,
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
    shouldDisplayOperationsList,
    shouldAddBottomPaddingForLegacyAssets,
    shouldDisplayLoansSection,
  ]);

  return (
    <>
      <CheckLanguageAvailability />
      <CheckTermOfUseUpdate />
      <Animated.View testID="portfolio-screen" style={{ flex: 1 }}>
        <RefreshableCollapsibleHeaderFlatList
          onFlatListRef={handleFlatListRef}
          data={data}
          renderItem={renderItem<React.JSX.Element>}
          keyExtractor={(_: unknown, index: number) => String(index)}
          showsVerticalScrollIndicator={false}
          testID={showAssets ? "PortfolioAccountsList" : "PortfolioEmptyList"}
          useSafeArea={!shouldDisplayWallet40MainNav}
          overrideRefreshControlProps={{ progressViewOffset }}
          isError={isSyncError}
        />
        <AddAccountDrawer
          isOpened={isAddModalOpened}
          onClose={closeAddModal}
          doesNotHaveAccount={!showAssets}
        />
      </Animated.View>
      <WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
        slides={slides}
      />
      <AnalyticsConsentDrawer />
    </>
  );
};
