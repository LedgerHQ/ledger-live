import React, { useMemo } from "react";
import { Platform } from "react-native";
import Animated from "react-native-reanimated";
import { ProductTourPortfolioMount } from "LLM/features/ProductTour";
import { useQ2WalletV4TourDrawer, Q2WalletV4TourDrawer } from "LLM/features/Q2WalletV4Tour/Drawer";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { useWalletV4TourDrawer, WalletV4TourDrawer } from "LLM/features/WalletV4Tour/Drawer";
import { renderItem } from "LLM/utils/renderItem";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { PortfolioNavigatorStackParamList } from "~/components/RootNavigator/types/PortfolioNavigator";
import { AnalyticsConsentDrawer } from "LLM/features/AnalyticsConsentDrawer";
import TrackScreen from "~/analytics/TrackScreen";
import {
  PROGRESS_VIEW_OFFSET_LEGACY_ANDROID,
  PROGRESS_VIEW_OFFSET_LEGACY_IOS,
} from "../../constants";
import { getProgressViewOffset } from "../../utils/getProgressViewOffset";
import usePortfolioViewModel from "./usePortfolioViewModel";
import { useScrollToTop } from "./useScrollToTop";

import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import MarketBanner from "LLM/features/MarketBanner";
import { GenericAwarenessModalDrawer } from "LLM/features/GenericAwarenessModal/screens/GenericAwarenessModalDrawer";
import { RecoverIntroPortfolioMount } from "LLM/features/BackupHub";
import { LargeScreenUpsellModalPortfolioMount } from "LLM/features/LargeScreenUpsell";

import {
  PortfolioAssetsSection,
  WalletAssetsView,
  PortfolioCarouselSection,
  PortfolioEmptySection,
  PortfolioHeaderSection,
  PortfolioOperationsSection,
  PortfolioBannersSection,
  PortfolioPerpsEntryPoint,
} from "../../components";
import { Box } from "@ledgerhq/native-ui";
type NavigationProps = BaseComposite<
  StackNavigatorProps<PortfolioNavigatorStackParamList, ScreenName.Portfolio>
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
    shouldDisplayAssetSection,
    showAssets,
    isLNSUpsellBannerShown,
    isAddModalOpened,
    backgroundColor,
    isSyncError,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
    shouldDisplayOperationsList,
    shouldAddBottomPaddingForLegacyAssets,
  } = usePortfolioViewModel(navigation);

  const progressViewOffset = getProgressViewOffset(Platform.OS);

  const { handleFlatListRef } = useScrollToTop();

  const { isDrawerOpen, handleCloseDrawer, closeDrawer, onSlideChange, slides } =
    useWalletV4TourDrawer();
  const {
    isDrawerOpen: isQ2DrawerOpen,
    handleCloseDrawer: handleCloseQ2Drawer,
    closeDrawer: closeQ2Drawer,
    onSlideChange: onQ2SlideChange,
  } = useQ2WalletV4TourDrawer();

  const data = useMemo(() => {
    const sections: React.JSX.Element[] = [];

    const heroCtasNode = showAssets ? (
      <>
        <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
        <TransferDrawer />
      </>
    ) : undefined;

    sections.push(
      <PortfolioHeaderSection
        key="header"
        showAssets={showAssets}
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

    sections.push(<TrackScreen key="trackWallet" category="Wallet" />);

    sections.push(
      <Box key="portfolioBannersSection" px={6} backgroundColor="background.contrast">
        <PortfolioBannersSection
          key="banners"
          isFirst={true}
          isLNSUpsellBannerShown={isLNSUpsellBannerShown}
          showAssets={showAssets}
        />
      </Box>,
    );

    sections.push(
      <Box key="marketBanner" px={6}>
        <MarketBanner />
      </Box>,
    );

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

    if (!shouldDisplayOperationsList) {
      sections.push(<PortfolioOperationsSection key="operations" />);
    }

    return sections;
  }, [
    showAssets,
    shouldDisplayAssetSection,
    onBackFromUpdate,
    isLNSUpsellBannerShown,
    isAccountListUIEnabled,
    hideEmptyTokenAccount,
    openAddModal,
    handleHeightChange,
    isAWalletCardDisplayed,
    backgroundColor,
    shouldDisplayOperationsList,
    shouldAddBottomPaddingForLegacyAssets,
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
          useSafeArea={false}
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
      <Q2WalletV4TourDrawer
        isDrawerOpen={isQ2DrawerOpen}
        handleCloseDrawer={handleCloseQ2Drawer}
        closeDrawer={closeQ2Drawer}
        onSlideChange={onQ2SlideChange}
      />
      <ProductTourPortfolioMount />
      <AnalyticsConsentDrawer />
      <GenericAwarenessModalDrawer />
      <RecoverIntroPortfolioMount />
      <LargeScreenUpsellModalPortfolioMount />
    </>
  );
};
