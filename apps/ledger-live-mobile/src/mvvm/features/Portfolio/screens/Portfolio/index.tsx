import React from "react";
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
import {
  PROGRESS_VIEW_OFFSET_LEGACY_ANDROID,
  PROGRESS_VIEW_OFFSET_LEGACY_IOS,
} from "../../constants";
import { getProgressViewOffset } from "../../utils/getProgressViewOffset";
import usePortfolioViewModel from "./usePortfolioViewModel";
import { useScrollToTop } from "./useScrollToTop";
import { QuickActionsCtas, TransferDrawer } from "LLM/features/QuickActions";
import { PortfolioHeaderSection } from "../../components";
import { PortfolioMainView } from "./views/PortfolioMainView";
import { PortfolioNoAccountsView } from "./views/PortfolioNoAccountsView";
import { PortfolioNoSignerView } from "./views/PortfolioNoSignerView";

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
    shouldDisplayMarketBanner,
    showAssets,
    isLNSUpsellBannerShown,
    isAddModalOpened,
    shouldDisplayGraphRework,
    backgroundColor,
    isSyncError,
    activeView,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
    goToAnalyticsAllocations,
    shouldDisplayWallet40MainNav,
  } = usePortfolioViewModel(navigation);

  const progressViewOffset = getProgressViewOffset(Platform.OS, shouldDisplayWallet40MainNav);

  const { handleFlatListRef } = useScrollToTop();

  const { isDrawerOpen, handleCloseDrawer, closeDrawer, onSlideChange, slides } =
    useWalletV4TourDrawer();

  const heroCtasNode =
    showAssets && shouldDisplayQuickActionCtas && shouldDisplayGraphRework ? (
      <>
        <QuickActionsCtas sourceScreenName={ScreenName.Portfolio} />
        <TransferDrawer />
      </>
    ) : undefined;

  const content =
    activeView === "main" ? (
      <PortfolioMainView
        shouldDisplayQuickActionCtas={shouldDisplayQuickActionCtas}
        shouldDisplayGraphRework={shouldDisplayGraphRework}
        shouldDisplayMarketBanner={shouldDisplayMarketBanner}
        shouldDisplayAssetSection={shouldDisplayAssetSection}
        isAccountListUIEnabled={isAccountListUIEnabled}
        hideEmptyTokenAccount={hideEmptyTokenAccount}
        isAWalletCardDisplayed={isAWalletCardDisplayed}
        backgroundColor={backgroundColor}
        isLNSUpsellBannerShown={isLNSUpsellBannerShown}
        openAddModal={openAddModal}
        handleHeightChange={handleHeightChange}
        goToAnalyticsAllocations={goToAnalyticsAllocations}
      />
    ) : activeView === "noAccounts" ? (
      <PortfolioNoAccountsView
        isLNSUpsellBannerShown={isLNSUpsellBannerShown}
        shouldDisplayAssetSection={shouldDisplayAssetSection}
        openAddModal={openAddModal}
      />
    ) : (
      <PortfolioNoSignerView
        isLNSUpsellBannerShown={isLNSUpsellBannerShown}
        shouldDisplayAssetSection={shouldDisplayAssetSection}
      />
    );

  const data = [
    <PortfolioHeaderSection
      key="header"
      showAssets={showAssets}
      hideGraph={shouldDisplayGraphRework}
      onBackFromUpdate={onBackFromUpdate}
      ctas={heroCtasNode}
    />,
    content,
  ];

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
          testID={activeView === "main" ? "PortfolioAccountsList" : "PortfolioEmptyList"}
          useSafeArea={!shouldDisplayWallet40MainNav}
          overrideRefreshControlProps={{ progressViewOffset }}
          isError={isSyncError}
        />
        <AddAccountDrawer
          isOpened={isAddModalOpened}
          onClose={closeAddModal}
          doesNotHaveAccount={activeView !== "main"}
        />
      </Animated.View>
      <WalletV4TourDrawer
        isDrawerOpen={isDrawerOpen}
        handleCloseDrawer={handleCloseDrawer}
        closeDrawer={closeDrawer}
        onSlideChange={onSlideChange}
        slides={slides}
      />
    </>
  );
};
