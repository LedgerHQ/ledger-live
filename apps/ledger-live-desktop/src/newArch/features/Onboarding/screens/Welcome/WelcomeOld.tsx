import { Button, Flex, IconsLegacy, InvertThemeV3, Logos, Text } from "@ledgerhq/react-ui";
import React from "react";
import { useTheme } from "styled-components";
import LangSwitcher from "~/renderer/components/Onboarding/LangSwitcher";
import AnalyticsOptInPrompt from "LLD/features/AnalyticsOptInPrompt/screens";
import LedgerSyncEntryPoint from "LLD/features/LedgerSyncEntryPoints";
import { EntryPoint as LSEntryPoint } from "LLD/features/LedgerSyncEntryPoints/types";
import WalletSyncDrawer from "LLD/features/WalletSync/components/Drawer";
import { AnalyticsPage } from "LLD/features/WalletSync/hooks/useLedgerSyncAnalytics";
import BuyNanoX from "./assets/buyNanoX.webm";

import { useWelcomeViewModel } from "./useWelcomeViewModel";
import {
  WelcomeContainer,
  LeftContainer,
  Presentation,
  ProductHighlight,
  TermsAndConditionsContainer,
  TermsAndConditionsText,
  RightContainer,
  CarouselTopBar,
  VideoWrapper,
  Description,
  StyledLink,
} from "./components/WelcomeOldStyles";

export function WelcomeOld() {
  const {
    t,
    history,
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
  } = useWelcomeViewModel();

  const { colors } = useTheme();

  return (
    <WelcomeContainer>
      <LeftContainer>
        <Presentation>
          <Logos.LedgerLiveRegular color={colors.neutral.c100} />
          <Text
            data-testid="onbording-welcome-title"
            variant="h1"
            pt={10}
            pb={7}
            onClick={() => handleOpenFeatureFlagsDrawer("1")}
          >
            {t("onboarding.screens.welcome.title")}
          </Text>
          <Description variant="body" onClick={() => handleOpenFeatureFlagsDrawer("2")}>
            {t("onboarding.screens.welcome.description")}
          </Description>
        </Presentation>
        <ProductHighlight>
          {isFeatureFlagsSettingsButtonDisplayed && (
            <Button variant="main" outline mb="24px" onClick={() => history.push("/settings")}>
              {t("settings.title")}
            </Button>
          )}
          <Button
            data-testid="v3-onboarding-get-started-button"
            iconPosition="right"
            Icon={IconsLegacy.ArrowRightMedium}
            variant="main"
            onClick={handleGetStarted}
            mb="5"
          >
            {t("onboarding.screens.welcome.nextButton")}
          </Button>
          <Button
            iconPosition="right"
            variant="main"
            onClick={handleBuyNew}
            outline={true}
            flexDirection="column"
            whiteSpace="normal"
          >
            {t("onboarding.screens.welcome.buyLink")}
          </Button>
          <LedgerSyncEntryPoint
            entryPoint={LSEntryPoint.onboarding}
            needEligibleDevice={false}
            onPress={handleSetupLedgerSync}
          />
          {__DEV__ ? (
            <Button
              mt="24px"
              iconPosition="right"
              onClick={skipOnboarding}
              outline={true}
              flexDirection="column"
              whiteSpace="normal"
            >
              {"(DEV) skip onboarding"}
            </Button>
          ) : null}
          <TermsAndConditionsContainer>
            <TermsAndConditionsText>
              {t("onboarding.screens.welcome.byTapping")}{" "}
              <StyledLink
                onClick={openTermsAndConditions}
                marginRight={2}
                color={colors.primary.c80}
              >
                {t("onboarding.screens.welcome.termsAndConditions")}
              </StyledLink>
              {t("onboarding.screens.welcome.and")}{" "}
              <StyledLink onClick={openPrivacyPolicy} marginRight={2} color={colors.primary.c80}>
                {t("onboarding.screens.welcome.privacyPolicy")}
              </StyledLink>
            </TermsAndConditionsText>
          </TermsAndConditionsContainer>
        </ProductHighlight>
      </LeftContainer>
      <RightContainer>
        <CarouselTopBar>
          {colors.palette.type === "dark" ? (
            <InvertThemeV3>
              <LangSwitcher />
            </InvertThemeV3>
          ) : (
            <LangSwitcher />
          )}
        </CarouselTopBar>
        <VideoWrapper>
          <video autoPlay loop>
            <source src={BuyNanoX} type="video/webm" />
          </video>
        </VideoWrapper>
        {isFeatureFlagsAnalyticsPrefDisplayed && (
          <AnalyticsOptInPrompt {...extendedAnalyticsOptInPromptProps} />
        )}
      </RightContainer>
      <WalletSyncDrawer currentPage={AnalyticsPage.Onboarding} onClose={closeDrawer} />
    </WelcomeContainer>
  );
}
