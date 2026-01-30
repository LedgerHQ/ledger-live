import { Button, Flex, Box, Logos } from "@ledgerhq/react-ui";
import React from "react";
import { Trans } from "react-i18next";
import { useTheme } from "styled-components";
import AnalyticsOptInPrompt from "LLD/features/AnalyticsOptInPrompt/screens";
import LedgerSyncEntryPoint from "LLD/features/LedgerSyncEntryPoints";
import { EntryPoint as LSEntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";

import { useWelcomeNewViewModel } from "./hooks/useWelcomeNewViewModel";
import { useVideoCarousel } from "./hooks/useVideoCarousel";
import {
  WelcomeContainer,
  VideoBackground,
  ContentOverlay,
  TopSection,
  ProgressBarsContainer,
  ProgressBar,
  TitleText,
  BottomSection,
  TermsAndConditionsText,
  StyledLink,
} from "./components/WelcomeNewStyles";

export function WelcomeNew() {
  const {
    t,
    accessSettings,
    openTermsAndConditions,
    openPrivacyPolicy,
    isFeatureFlagsSettingsButtonDisplayed,
    handleOpenFeatureFlagsDrawer,
    skipOnboarding,
    handleGetStarted,
    handleBuyNew,
    handleSetupLedgerSync,
    isFeatureFlagsAnalyticsPrefDisplayed,
    extendedAnalyticsOptInPromptProps,
    closeDrawer,
  } = useWelcomeNewViewModel();

  const {
    currentSlide,
    isVisible,
    videoDurations,
    VIDEO_SLIDES,
    videoRefs,
    containerRef,
    handleVideoLoadedMetadata,
    handleVideoEnded,
  } = useVideoCarousel();

  const { colors } = useTheme();

  return (
    <WelcomeContainer ref={containerRef}>
      {VIDEO_SLIDES.map(({ video, id }, index) => (
        <VideoBackground
          ref={el => {
            videoRefs.current[index] = el;
          }}
          autoPlay={index === currentSlide && isVisible}
          muted
          key={`video-${id}`}
          onLoadedMetadata={() => handleVideoLoadedMetadata(index)}
          onEnded={handleVideoEnded}
          isActive={index === currentSlide}
          isFull={index < currentSlide}
        >
          <source src={video} type="video/webm" />
        </VideoBackground>
      ))}
      <ContentOverlay>
        <TopSection>
          <Box onClick={() => handleOpenFeatureFlagsDrawer("1")}>
            <Logos.LedgerLiveRegular color={colors.neutral.c100} height={32} />
          </Box>
          <ProgressBarsContainer onClick={() => handleOpenFeatureFlagsDrawer("2")}>
            {VIDEO_SLIDES.map(({ id }, index) => (
              <ProgressBar
                key={`progress-bar-${id}`}
                isActive={index === currentSlide && isVisible}
                isFull={index < currentSlide}
                transitionDuration={videoDurations[index]}
              />
            ))}
          </ProgressBarsContainer>
          {isVisible && (
            <TitleText key={currentSlide}>{VIDEO_SLIDES[currentSlide].title}</TitleText>
          )}
        </TopSection>

        <Box flex={1} />

        <BottomSection>
          {isFeatureFlagsSettingsButtonDisplayed && (
            <Button variant="main" outline onClick={accessSettings}>
              {t("settings.title")}
            </Button>
          )}

          <Flex columnGap="16px">
            <Button
              data-testid="v3-onboarding-get-started-button"
              variant="main"
              onClick={handleGetStarted}
              minWidth="250px"
            >
              {t("onboarding.screens.welcome.nextButton")}
            </Button>

            <Button
              data-testid="onboarding-device-button"
              iconPosition="right"
              variant="neutral"
              onClick={handleBuyNew}
              outline={true}
              flexDirection="column"
              whiteSpace="normal"
              minWidth="250px"
            >
              {t("onboarding.screens.welcome.buyLink")}
            </Button>
          </Flex>

          <LedgerSyncEntryPoint
            entryPoint={LSEntryPoint.onboarding}
            needEligibleDevice={false}
            onPress={handleSetupLedgerSync}
          />

          {__DEV__ ? (
            <Button
              iconPosition="right"
              onClick={skipOnboarding}
              outline={true}
              flexDirection="column"
              whiteSpace="normal"
            >
              {"(DEV) skip onboarding"}
            </Button>
          ) : null}

          <TermsAndConditionsText>
            <Trans
              i18nKey="onboarding.screens.welcome.notice"
              components={{
                Link1: <StyledLink onClick={openTermsAndConditions} />,
                Link2: <StyledLink onClick={openPrivacyPolicy} />,
              }}
            />
          </TermsAndConditionsText>
        </BottomSection>
      </ContentOverlay>
      {isFeatureFlagsAnalyticsPrefDisplayed && (
        <AnalyticsOptInPrompt {...extendedAnalyticsOptInPromptProps} />
      )}
      <WalletSyncDrawer currentPage={AnalyticsPage.Onboarding} onClose={closeDrawer} />
    </WelcomeContainer>
  );
}
