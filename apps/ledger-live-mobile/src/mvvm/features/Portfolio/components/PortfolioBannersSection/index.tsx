import React from "react";
import {
  FlatList,
  ListRenderItemInfo,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from "react-native";
import { Box, PageIndicator } from "@ledgerhq/lumen-ui-rnative";
import { LNUpsellBanner } from "LLM/features/LNUpsell/components/LNUpsellBanner";
import { LazyOnboardingBannerView } from "LLM/features/LazyOnboardingBanner";
import ContentCardsLocation from "~/dynamicContent/ContentCardsLocation";
import { ContentCardLocation } from "~/dynamicContent/types";
import { width } from "~/helpers/normalizeSize";
import SectionContainer from "~/screens/WalletCentricSections/SectionContainer";
import RecoverBanner from "../RecoverBanner";
import { OnboardingWidget } from "../OnboardingWidget";
import { usePortfolioBannersSectionViewModel } from "./usePortfolioBannersSectionViewModel";

const CAROUSEL_SLIDE_WIDTH = width - 32;

const ONBOARDING_RECOVER_SLIDES = [
  { key: "onboarding", slide: "onboarding" as const },
  { key: "recover", slide: "recover" as const },
] as const;

type CarouselSlide = (typeof ONBOARDING_RECOVER_SLIDES)[number];

interface PortfolioBannersSectionProps {
  readonly isFirst: boolean;
  readonly isLNUpsellBannerShown: boolean;
  readonly showAssets?: boolean;
}

type BannersSectionShellProps = {
  readonly isFirst: boolean;
  readonly children: React.ReactNode;
};

function BannersSectionShell({ isFirst, children }: BannersSectionShellProps) {
  return (
    <SectionContainer
      py="0"
      mt={0}
      isFirst={isFirst}
      key="BannersSection"
      testID="portfolio-banners-section"
    >
      {children}
    </SectionContainer>
  );
}

type PaddedBannerProps = {
  readonly children: React.ReactNode;
};

function PaddedBanner({ children }: PaddedBannerProps) {
  return <Box lx={{ paddingTop: "s12" }}>{children}</Box>;
}

function OnboardingRecoverCarouselSeparator() {
  return <Box style={{ width: 12 }} />;
}

type OnboardingRecoverCarouselProps = {
  readonly carouselIndex: number;
  readonly onScroll: (event: NativeSyntheticEvent<NativeScrollEvent>) => void;
};

function OnboardingRecoverCarousel({ carouselIndex, onScroll }: OnboardingRecoverCarouselProps) {
  return (
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
        data={ONBOARDING_RECOVER_SLIDES}
        keyExtractor={item => item.key}
        ItemSeparatorComponent={OnboardingRecoverCarouselSeparator}
        renderItem={({ item }: ListRenderItemInfo<CarouselSlide>) => (
          <Box style={{ width: CAROUSEL_SLIDE_WIDTH }}>
            {item.slide === "onboarding" ? (
              <OnboardingWidget />
            ) : (
              <RecoverBanner paddingHorizontal="s0" />
            )}
          </Box>
        )}
      />

      <Box lx={{ alignItems: "center" }} testID="banners-page-indicator">
        <PageIndicator
          currentPage={Math.min(carouselIndex + 1, ONBOARDING_RECOVER_SLIDES.length)}
          totalPages={ONBOARDING_RECOVER_SLIDES.length}
        />
      </Box>
    </Box>
  );
}

export const PortfolioBannersSection = ({
  isFirst,
  isLNUpsellBannerShown,
  showAssets,
}: PortfolioBannersSectionProps) => {
  const {
    lazyOnboardingBanner,
    shouldShowOnboardingWidget: showOnboarding,
    shouldDisplayRecover: showRecover,
    contentCardsPaddingTop,
    hasAssets,
    onScroll,
    carouselIndex,
  } = usePortfolioBannersSectionViewModel({ showAssets });

  if (lazyOnboardingBanner.isShown) {
    return (
      <BannersSectionShell isFirst={isFirst}>
        <PaddedBanner>
          <LazyOnboardingBannerView {...lazyOnboardingBanner} />
        </PaddedBanner>
      </BannersSectionShell>
    );
  }

  if (isLNUpsellBannerShown) {
    return (
      <BannersSectionShell isFirst={isFirst}>
        <LNUpsellBanner location="wallet" pt={4} />
      </BannersSectionShell>
    );
  }

  if (!showOnboarding && !showRecover && !hasAssets) return null;

  if (hasAssets && !showOnboarding) {
    return (
      <BannersSectionShell isFirst={isFirst}>
        <Box>
          {showRecover && (
            <PaddedBanner>
              <RecoverBanner paddingHorizontal="s0" />
            </PaddedBanner>
          )}
          <Box lx={contentCardsPaddingTop ? { paddingTop: contentCardsPaddingTop } : undefined}>
            <ContentCardsLocation
              key="contentCardsLocationPortfolio"
              locationId={ContentCardLocation.TopWallet}
              mx={-6}
            />
          </Box>
        </Box>
      </BannersSectionShell>
    );
  }

  // Onboarding + recover: horizontal carousel.
  if (showOnboarding && showRecover) {
    return (
      <BannersSectionShell isFirst={isFirst}>
        <OnboardingRecoverCarousel carouselIndex={carouselIndex} onScroll={onScroll} />
      </BannersSectionShell>
    );
  }

  // Single banner: onboarding and/or recover, stacked.
  if (showOnboarding || showRecover) {
    return (
      <BannersSectionShell isFirst={isFirst}>
        <Box>
          {showOnboarding && (
            <PaddedBanner>
              <OnboardingWidget />
            </PaddedBanner>
          )}
          {showRecover && (
            <PaddedBanner>
              <RecoverBanner paddingHorizontal="s0" />
            </PaddedBanner>
          )}
        </Box>
      </BannersSectionShell>
    );
  }

  return null;
};
