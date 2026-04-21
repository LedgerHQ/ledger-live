import React from "react";
import { FlatList } from "react-native";
import { Box, PageIndicator } from "@ledgerhq/lumen-ui-rnative";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import { LNSUpsellBanner } from "LLM/features/LNSUpsell/components/LNSUpsellBanner";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import RecoverBanner from "../RecoverBanner";
import { OnboardingWidget } from "../OnboardingWidget";
import { usePortfolioBannersSectionViewModel } from "./usePortfolioBannersSectionViewModel";
import { width } from "~/helpers/normalizeSize";

interface PortfolioBannersSectionProps {
  readonly isFirst: boolean;
  readonly isLNSUpsellBannerShown: boolean;
  readonly showAssets?: boolean;
}

export const PortfolioBannersSection = ({
  isFirst,
  isLNSUpsellBannerShown,
  showAssets,
}: PortfolioBannersSectionProps) => {
  const {
    shouldShowOnboardingWidget,
    sectionMarginTop,
    hasAssets,
    shouldDisplayRecover,
    onScroll,
    carouselIndex,
    hasMultipleCards,
  } = usePortfolioBannersSectionViewModel({
    showAssets,
  });

  if (isLNSUpsellBannerShown) {
    return (
      <SectionContainer
        py="0"
        mt={0}
        isFirst={isFirst}
        key="BannersSection"
        testID="portfolio-banners-section"
      >
        <LNSUpsellBanner location="wallet" mx={6} mb={6} />
      </SectionContainer>
    );
  }
  if (!shouldShowOnboardingWidget && !shouldDisplayRecover && !hasAssets) return null;

  if (hasAssets && !shouldShowOnboardingWidget) {
    return (
      <SectionContainer
        py="0"
        mt={0}
        isFirst={isFirst}
        key="BannersSection"
        testID="portfolio-banners-section"
      >
        <Box lx={{ marginTop: sectionMarginTop }}>
          <RecoverBanner />

          <ContentCardsLocation
            key="contentCardsLocationPortfolio"
            locationId={ContentCardLocation.TopWallet}
          />
        </Box>
      </SectionContainer>
    );
  }

  const carouselItems = [
    ...(shouldShowOnboardingWidget
      ? [{ key: "onboarding", component: <OnboardingWidget />, padded: true }]
      : []),
    ...(shouldDisplayRecover
      ? [{ key: "recover", component: <RecoverBanner />, padded: false }]
      : []),
  ];

  return (
    <SectionContainer
      py="0"
      mt={0}
      isFirst={isFirst}
      key="BannersSection"
      testID="portfolio-banners-section"
    >
      <Box lx={{ marginTop: sectionMarginTop, gap: "s8", marginBottom: "s24" }}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          onScroll={onScroll}
          onMomentumScrollEnd={onScroll}
          disableIntervalMomentum
          snapToInterval={width}
          decelerationRate={0}
          scrollEventThrottle={16}
          bounces={false}
          data={carouselItems}
          keyExtractor={item => item.key}
          renderItem={({ item }) => (
            <Box style={{ width }} lx={item.padded ? { paddingHorizontal: "s16" } : undefined}>
              {item.component}
            </Box>
          )}
        />
        {hasMultipleCards && (
          <Box lx={{ alignItems: "center" }} testID="banners-page-indicator">
            <PageIndicator
              currentPage={Math.min(carouselIndex + 1, carouselItems.length)}
              totalPages={carouselItems.length}
            />
          </Box>
        )}
      </Box>
    </SectionContainer>
  );
};
