import { Button, Flex, Box, Logos, Text } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Trans, useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled, { useTheme, keyframes } from "styled-components";
import { saveSettings } from "~/renderer/actions/settings";
import { openURL } from "~/renderer/linking";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { acceptTerms } from "~/renderer/terms";
import { useLocalizedUrl } from "~/renderer/hooks/useLocalizedUrls";
import { urls } from "~/config/urls";
import AnalyticsOptInPrompt from "LLD/features/AnalyticsOptInPrompt/screens";
import { useAnalyticsOptInPrompt } from "LLD/features/AnalyticsOptInPrompt/hooks/useCommonLogic";
import { EntryPoint } from "LLD/features/AnalyticsOptInPrompt/types/AnalyticsOptInPromptNavigator";
import LedgerSyncEntryPoint from "LLD/features/LedgerSyncEntryPoints";
import { EntryPoint as LSEntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import { useActivationDrawer } from "LLD/features/LedgerSyncEntryPoints/hooks/useActivationDrawer";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import { trustchainSelector } from "@ledgerhq/ledger-key-ring-protocol/store";

import LedgerWalletBuySell from "./assets/ledgerWalletBuySell.webm";
import LedgerWalletThousandsCrypto from "./assets/ledgerWalletThousandsCrypto.webm";
import LedgerWalletSecureWallet from "./assets/ledgerWalletSecureWallet.webm";

const fadeInOut = keyframes`
  0% { opacity: 0; }
  100% { opacity: 1; }
`;

const StyledLink = styled(Text).attrs({ fontSize: "inherit" })`
  text-decoration: underline;
  cursor: pointer;
`;

const WelcomeContainer = styled(Flex).attrs({
  flexDirection: "column",
  height: "100vh",
  width: "100vw",
  position: "relative",
})`
  overflow: hidden;
`;

const VideoBackground = styled.video<{ isActive: boolean; isFull: boolean }>`
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  object-fit: cover;
  z-index: 0;
  opacity: ${props => (props.isActive ? "1" : "0")};
  transition: opacity 0.2s ease-in-out ${props => (props.isFull ? "0.1s" : "0s")};
`;

const ContentOverlay = styled(Flex).attrs({
  flexDirection: "column",
  height: "100%",
  width: "100%",
  position: "relative",
})`
  z-index: 1;
  background: rgba(0, 0, 0, 0.3);
`;

const TopSection = styled(Flex).attrs({
  flexDirection: "column",
  rowGap: "16px",
  alignItems: "center",
  p: "40px",
})``;

const ProgressBarsContainer = styled(Flex).attrs({
  flexDirection: "row",
  columnGap: "4px",
  width: "300px",
})``;

const ProgressBar = styled.div<{
  isActive: boolean;
  isFull: boolean;
  transitionDuration: number;
}>`
  height: 3px;
  flex: 1;
  background: ${props =>
    props.isFull ? props.theme.colors.neutral.c100 : props.theme.colors.neutral.c30};
  border-radius: 2px;
  position: relative;
  overflow: hidden;

  &::after {
    content: "";
    position: absolute;
    top: 0;
    left: 0;
    height: 100%;
    background: ${props => props.theme.colors.neutral.c100};
    border-radius: 2px;
    opacity: ${props => (props.isFull || !props.isActive ? "0" : "1")};
    width: ${props => (props.isActive ? "100%" : "0%")};
    transition: width ${props => props.transitionDuration}s linear;
  }
`;

const TitleText = styled(Text).attrs({
  fontSize: "24px",
  fontWeight: "600",
  textAlign: "center",
  maxWidth: "600px",
  letterSpacing: "-0.05em",
})`
  animation: ${fadeInOut} 1s ease-in-out;
`;

const BottomSection = styled(Flex).attrs({
  flexDirection: "column",
  alignItems: "center",
  p: "40px",
  rowGap: "16px",
})``;

const TermsAndConditionsText = styled(Text).attrs({
  textAlign: "center",
  overflowWrap: "normal",
  whiteSpace: "pre-line",
  fontSize: "12px",
  opacity: 0.8,
})``;

export function WelcomeNew() {
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();
  const { colors } = useTheme();

  const urlBuyNew = useLocalizedUrl(urls.buyNew);
  const buyNew = () => openURL(urlBuyNew);
  const urlTerms = useLocalizedUrl(urls.terms);
  const openTermsAndConditions = () => openURL(urlTerms);
  const urlPrivacyPolicy = useLocalizedUrl(urls.privacyPolicy);
  const openPrivacyPolicy: () => void = () => openURL(urlPrivacyPolicy);

  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const trustchain = useSelector(trustchainSelector);
  useEffect(() => {
    if (hasCompletedOnboarding && !trustchain) {
      history.push("/onboarding/select-device");
    }
  }, [hasCompletedOnboarding, history, trustchain]);

  const countLogo = useRef(0);
  const countProgressBars = useRef(0);
  const [isFeatureFlagsSettingsButtonDisplayed, setIsFeatureFlagsSettingsButtonDisplayed] =
    useState<boolean>(false);

  const skipOnboarding = useCallback(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    history.push("/settings");
  }, [dispatch, history]);

  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleOpenFeatureFlagsDrawer = useCallback((nb: string) => {
    if (nb === "1") countLogo.current++;
    else if (nb === "2") countProgressBars.current++;
    if (countLogo.current > 3 && countProgressBars.current > 5) {
      countLogo.current = 0;
      countProgressBars.current = 0;
      setIsFeatureFlagsSettingsButtonDisplayed(true);
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      countLogo.current = 0;
      countProgressBars.current = 0;
    }, 1000);
  }, []);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const handleAcceptTermsAndGetStarted = useCallback(() => {
    acceptTerms();
    history.push("/onboarding/select-device");
  }, [history]);

  const {
    analyticsOptInPromptProps,
    isFeatureFlagsAnalyticsPrefDisplayed,
    openAnalyticsOptInPrompt,
    onSubmit,
  } = useAnalyticsOptInPrompt({
    entryPoint: EntryPoint.onboarding,
  });

  const extendedAnalyticsOptInPromptProps = {
    ...analyticsOptInPromptProps,
    onSubmit,
  };

  const { openDrawer, closeDrawer } = useActivationDrawer();

  const setupLedgerSync = () => {
    acceptTerms();
    openDrawer();
  };

  // VIDEO CAROUSEL HANDLING
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([null, null, null]);
  const [videoDurations, setVideoDurations] = useState<number[]>([0, 0, 0]);
  const containerRef = useRef<HTMLDivElement>(null);

  const VIDEO_SLIDES = useMemo(
    () => [
      {
        video: LedgerWalletBuySell,
        title: t("onboarding.screens.welcome.videos.buySell"),
        id: "buy-sell",
      },
      {
        video: LedgerWalletThousandsCrypto,
        title: t("onboarding.screens.welcome.videos.thousandsCrypto"),
        id: "thousands-crypto",
      },
      {
        video: LedgerWalletSecureWallet,
        title: t("onboarding.screens.welcome.videos.secureWallet"),
        id: "secure-wallet",
      },
    ],
    [t],
  );

  const handleVideoLoadedMetadata = useCallback((index: number) => {
    if (videoRefs.current[index]) {
      setVideoDurations(prev => {
        const newDurations = [...prev];
        newDurations[index] = videoRefs.current[index]?.duration ?? 0;
        return newDurations;
      });
    }
  }, []);

  const handleVideoEnded = useCallback(() => {
    setCurrentSlide(prev => (prev + 1) % VIDEO_SLIDES.length);
  }, [VIDEO_SLIDES.length]);

  useEffect(() => {
    const fallbackTimeout = setTimeout(() => {
      if (!isVisible) {
        setIsVisible(true);
      }
    }, 6000);

    if (!isVisible) {
      const observer = new MutationObserver(() => {
        if (!document.getElementById("loader-container")) {
          setIsVisible(true);
        }
      });

      observer.observe(document.body, {
        childList: true,
        subtree: true,
      });

      return () => {
        observer.disconnect();
        clearTimeout(fallbackTimeout);
      };
    }

    return () => clearTimeout(fallbackTimeout);
  }, [isVisible]);

  useEffect(() => {
    if (isVisible && videoRefs.current[currentSlide]) {
      videoRefs.current[currentSlide]?.play();
    }
  }, [currentSlide, isVisible]);

  return (
    <WelcomeContainer ref={containerRef}>
      {VIDEO_SLIDES.map(({ video, id }, index) => (
        <VideoBackground
          ref={el => (videoRefs.current[index] = el)}
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
            <Logos.LedgerLiveRegular color={colors.neutral.c100} />
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
            <Button variant="main" outline onClick={() => history.push("/settings")}>
              {t("settings.title")}
            </Button>
          )}

          <Flex columnGap="16px">
            <Button
              data-testid="v3-onboarding-get-started-button"
              variant="main"
              onClick={_ => {
                isFeatureFlagsAnalyticsPrefDisplayed
                  ? openAnalyticsOptInPrompt("Onboarding", handleAcceptTermsAndGetStarted)
                  : handleAcceptTermsAndGetStarted();
              }}
              minWidth="250px"
            >
              {t("onboarding.screens.welcome.nextButton")}
            </Button>

            <Button
              iconPosition="right"
              variant="neutral"
              onClick={_ => {
                isFeatureFlagsAnalyticsPrefDisplayed
                  ? openAnalyticsOptInPrompt("Onboarding", buyNew)
                  : buyNew();
              }}
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
            onPress={() => {
              isFeatureFlagsAnalyticsPrefDisplayed
                ? openAnalyticsOptInPrompt("Onboarding", setupLedgerSync)
                : setupLedgerSync();
            }}
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
