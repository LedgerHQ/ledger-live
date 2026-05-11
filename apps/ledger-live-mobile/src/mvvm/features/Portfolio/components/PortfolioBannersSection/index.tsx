import React from "react";
import { FlatList, ListRenderItemInfo } from "react-native";
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

const CAROUSEL_ITEMS = [
  { key: "onboarding", slide: "onboarding" as const },
  { key: "recover", slide: "recover" as const },
];

function OnboardingRecoverBannerSeparator() {
  return <Box style={{ width: 12 }} />;
}

function OnboardingRecoverBannerRow({
  item,
}: ListRenderItemInfo<(typeof CAROUSEL_ITEMS)[number]>) {
  return (
    <Box style={{ width: WIDTH }}>
      {item.slide === "onboarding" ? (
        <OnboardingWidget />
      ) : (
        <RecoverBanner paddingHorizontal="s0" />
      )}
    </Box>
  );
}

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
        <Box>
          {shouldDisplayRecover && (
            <Box lx={{ paddingTop: "s12" }}>
              <RecoverBanner paddingHorizontal="s0" />
            </Box>
          )}
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
            data={CAROUSEL_ITEMS}
            keyExtractor={item => item.key}
            ItemSeparatorComponent={OnboardingRecoverBannerSeparator}
            renderItem={OnboardingRecoverBannerRow}
          />

          <Box lx={{ alignItems: "center" }} testID="banners-page-indicator">
            <PageIndicator
              currentPage={Math.min(carouselIndex + 1, CAROUSEL_ITEMS.length)}
              totalPages={CAROUSEL_ITEMS.length}
            />
          </Box>
        </Box>
      </SectionContainer>
    );
  }

  if (shouldShowOnboardingWidget || shouldDisplayRecover) {
    return (
      <SectionContainer
        py="0"
        mt={0}
        isFirst={isFirst}
        key="BannersSection"
        testID="portfolio-banners-section"
      >
        <Box>
          {shouldShowOnboardingWidget && (
            <Box lx={{ paddingTop: "s12" }}>
              <OnboardingWidget />
            </Box>
          )}
          {shouldDisplayRecover && (
            <Box lx={{ paddingTop: "s12" }}>
              <RecoverBanner paddingHorizontal="s0" />
            </Box>
          )}
        </Box>
      </SectionContainer>
    );
  }
  return null;
};
