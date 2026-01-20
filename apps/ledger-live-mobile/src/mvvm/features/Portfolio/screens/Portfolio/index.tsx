import React, { useMemo } from "react";
import { Box, Flex, Text } from "@ledgerhq/native-ui";
import Animated from "react-native-reanimated";

import WalletTabSafeAreaView from "~/components/WalletTab/WalletTabSafeAreaView";
import Carousel from "~/components/Carousel";
import FirmwareUpdateBanner from "LLM/features/FirmwareUpdate/components/UpdateBanner";
import CheckLanguageAvailability from "~/components/CheckLanguageAvailability";
import CheckTermOfUseUpdate from "~/components/CheckTermOfUseUpdate";
import RecoverBanner from "~/components/RecoverBanner";
import PortfolioEmptyState from "~/screens/Portfolio/PortfolioEmptyState";
import SectionTitle from "~/screens/WalletCentricSections/SectionTitle";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import AllocationsSection from "~/screens/WalletCentricSections/Allocations";
import CollapsibleHeaderFlatList from "~/components/WalletTab/CollapsibleHeaderFlatList";
import globalSyncRefreshControl from "~/components/globalSyncRefreshControl";
import PortfolioOperationsHistorySection from "~/screens/Portfolio/PortfolioOperationsHistorySection";
import PortfolioGraphCard from "~/screens/Portfolio/PortfolioGraphCard";
import PortfolioAssets from "~/screens/Portfolio/PortfolioAssets";
import AnimatedContainer from "~/screens/Portfolio/AnimatedContainer";
import AddAccountDrawer from "LLM/features/Accounts/screens/AddAccount";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import { renderItem } from "LLM/utils/renderItem";
import { ScreenName } from "~/const";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";
import { WalletTabNavigatorStackParamList } from "~/components/RootNavigator/types/WalletTabNavigator";
import usePortfolioViewModel from "./usePortfolioViewModel";

type NavigationProps = BaseComposite<
  StackNavigatorProps<WalletTabNavigatorStackParamList, ScreenName.Portfolio>
>;

const RefreshableCollapsibleHeaderFlatList = globalSyncRefreshControl(CollapsibleHeaderFlatList, {
  progressViewOffset: 0,
});

function PortfolioScreen({ navigation }: NavigationProps) {
  const {
    hideEmptyTokenAccount,
    colors,
    isAWalletCardDisplayed,
    isAccountListUIEnabled,
    showAssets,
    isLNSUpsellBannerShown,
    isAddModalOpened,
    t,
    openAddModal,
    closeAddModal,
    handleHeightChange,
    onBackFromUpdate,
  } = usePortfolioViewModel(navigation);

  const data = useMemo(
    () => [
      <WalletTabSafeAreaView key="portfolioHeaderElements" edges={["left", "right"]}>
        <Flex px={6} key="FirmwareUpdateBanner">
          <FirmwareUpdateBanner onBackFromUpdate={onBackFromUpdate} />
        </Flex>
        <PortfolioGraphCard showAssets={showAssets} key="PortfolioGraphCard" />
        {isLNSUpsellBannerShown && <LNSUpsellBanner location="wallet" mx={6} mt={7} />}
        {!isLNSUpsellBannerShown && showAssets ? (
          <ContentCardsLocation
            key="contentCardsLocationPortfolio"
            locationId={ContentCardLocation.TopWallet}
            mt="20px"
          />
        ) : null}
      </WalletTabSafeAreaView>,
      showAssets ? (
        isAccountListUIEnabled ? (
          <AnimatedContainer onHeightChange={handleHeightChange}>
            <Box background={colors.background.main} px={6} key="PortfolioAssets">
              <RecoverBanner />
              <PortfolioAssets
                hideEmptyTokenAccount={hideEmptyTokenAccount}
                openAddModal={openAddModal}
              />
            </Box>
          </AnimatedContainer>
        ) : (
          <Box background={colors.background.main} px={6} key="PortfolioAssets">
            <RecoverBanner />
            <PortfolioAssets
              hideEmptyTokenAccount={hideEmptyTokenAccount}
              openAddModal={openAddModal}
            />
          </Box>
        )
      ) : null,
      ...(showAssets && isAWalletCardDisplayed
        ? [
            <Box background={colors.background.main} key="CarouselTitle">
              <SectionContainer px={0} minHeight={240} isFirst>
                <SectionTitle
                  title={t("portfolio.carousel.title")}
                  containerProps={{ mb: 7, mx: 6 }}
                />
                <Carousel />
              </SectionContainer>
            </Box>,
          ]
        : []),
      ...(showAssets
        ? [
            <SectionContainer px={6} isFirst={!isAWalletCardDisplayed} key="AllocationsSection">
              <SectionTitle
                title={t("analytics.allocation.title")}
                testID="portfolio-allocation-section"
              />
              <Flex minHeight={94}>
                <AllocationsSection />
              </Flex>
            </SectionContainer>,
            <SectionContainer px={6} key="PortfolioOperationsHistorySection">
              <SectionTitle
                title={t("analytics.operations.title")}
                testID="portfolio-transaction-history-section"
              />
              <PortfolioOperationsHistorySection />
            </SectionContainer>,
          ]
        : [
            <Flex flexDirection="column" mt={30} mx={6} key="PortfolioEmptyState">
              <RecoverBanner />
              <PortfolioEmptyState openAddAccountModal={openAddModal} />
            </Flex>,
          ]),
    ],
    [
      onBackFromUpdate,
      showAssets,
      isAccountListUIEnabled,
      handleHeightChange,
      colors.background.main,
      hideEmptyTokenAccount,
      openAddModal,
      isAWalletCardDisplayed,
      isLNSUpsellBannerShown,
      t,
    ],
  );

  const DebugBanner = __DEV__ ? (
    <Box backgroundColor="primary.c80" py={2} px={4} alignItems="center">
      {/* eslint-disable-next-line i18next/no-literal-string */}
      <Text color="neutral.c00" fontWeight="semiBold" fontSize={12}>
        MVVM Portfolio (lwmWallet40)
      </Text>
    </Box>
  ) : null;

  return (
    <>
      {DebugBanner}
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
    </>
  );
}

export default PortfolioScreen;
