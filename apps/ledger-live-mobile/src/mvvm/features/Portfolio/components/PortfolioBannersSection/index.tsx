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

const WIDTH = width - 32;

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
    hasAssets,
    shouldDisplayRecover,
    onScroll,
    carouselIndex,
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
        <LNSUpsellBanner location="wallet" pt={4} />
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
        <Box lx={{ paddingTop: "s12" }}>
          <RecoverBanner paddingHorizontal="s0" />
          <ContentCardsLocation
            key="contentCardsLocationPortfolio"
            locationId={ContentCardLocation.TopWallet}
            mx={-6}
          />
        </Box>
      </SectionContainer>
    );
  }

  if (shouldShowOnboardingWidget && shouldDisplayRecover) {
    const carouselItems = [
      { key: "onboarding", component: <OnboardingWidget /> },
      { key: "recover", component: <RecoverBanner paddingHorizontal="s0" /> },
    ];

    return (
      <SectionContainer
        py="0"
        mt={0}
        isFirst={isFirst}
        key="BannersSection"
        testID="portfolio-banners-section"
      >
        <Box lx={{ paddingTop: "s12", gap: "s8" }}>
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
            ItemSeparatorComponent={() => <Box style={{ width: 12 }} />}
            renderItem={({ item }) => <Box  style={{ width: WIDTH }}>{item.component}</Box>}
          />

          <Box lx={{ alignItems: "center" }} testID="banners-page-indicator">
            <PageIndicator
              currentPage={Math.min(carouselIndex + 1, carouselItems.length)}
              totalPages={carouselItems.length}
            />
          </Box>
        </Box>
      </SectionContainer>
    );
  }

  return (
    <SectionContainer
      py="0"
      mt={0}
      isFirst={isFirst}
      key="BannersSection"
      testID="portfolio-banners-section"
    >
      <Box lx={{ paddingTop: "s12" }}>
        {shouldShowOnboardingWidget && <OnboardingWidget />}
        {shouldDisplayRecover && <RecoverBanner paddingHorizontal="s0" />}
      </Box>
    </SectionContainer>
  );
};
