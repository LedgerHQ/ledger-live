import { Button, Flex, IconsLegacy, InvertThemeV3, Logos, Text } from "@ledgerhq/react-ui";
import React, { useCallback, useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import { useHistory } from "react-router-dom";
import styled, { useTheme } from "styled-components";
import { saveSettings } from "~/renderer/actions/settings";
import LangSwitcher from "~/renderer/components/Onboarding/LangSwitcher";
import { openURL } from "~/renderer/linking";
import { hasCompletedOnboardingSelector } from "~/renderer/reducers/settings";
import { acceptTerms } from "~/renderer/terms";
import BuyNanoX from "./assets/buyNanoX.webm";
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
import { ArrowUp } from "@ldls/ui-react/symbols";
import { Button as LdlsButton } from "@ldls/ui-react";

const StyledLink = styled(Text)`
  text-decoration: underline;
  cursor: pointer;
`;

const WelcomeContainer = styled(Flex).attrs({
  flexDirection: "row",
  height: "100%",
  width: "100%",
})``;

const LeftContainer = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "space-between",
  width: "386px",
  height: "100%",
  padding: "40px",
  zIndex: 49,
})``;

const Presentation = styled(Flex).attrs({ flexDirection: "column" })``;

const ProductHighlight = styled(Flex).attrs({
  flexDirection: "column",
  mb: 2,
})``;

const TermsAndConditionsContainer = styled(Flex).attrs({
  justifyContent: "center",
  flexWrap: "wrap",
  marginTop: "24px",
})``;

const TermsAndConditionsText = styled(Text).attrs({
  flex: 1,
  color: "neutral.c80",
  textAlign: "center",
  overflowWrap: "normal",
  whiteSpace: "normal",
})``;

const RightContainer = styled(Flex).attrs({
  flexDirection: "column",
  justifyContent: "space-between",
  height: "100%",
  overflow: "hidden",
  flexGrow: 1,
  backgroundColor: "constant.purple",
})``;

const CarouselTopBar = styled(Flex).attrs({
  justifyContent: "flex-end",
  alignItems: "center",
  padding: "40px",
  width: "100%",
  zIndex: 1,
})``;

const VideoWrapper = styled(Flex).attrs({
  objectFit: "cover",
  position: "fixed",
})``;

const Description = styled(Text)`
  white-space: pre-line;
`;

export function Welcome() {
  const hasCompletedOnboarding = useSelector(hasCompletedOnboardingSelector);
  const trustchain = useSelector(trustchainSelector);
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();
  const { colors } = useTheme();

  useEffect(() => {
    if (hasCompletedOnboarding && !trustchain) {
      history.push("/onboarding/select-device");
    }
  }, [hasCompletedOnboarding, history, trustchain]);

  const urlBuyNew = useLocalizedUrl(urls.buyNew);
  const buyNew = () => openURL(urlBuyNew);

  const urlTerms = useLocalizedUrl(urls.terms);
  const openTermsAndConditions = () => openURL(urlTerms);

  const urlPrivacyPolicy = useLocalizedUrl(urls.privacyPolicy);
  const openPrivacyPolicy = () => openURL(urlPrivacyPolicy);

  const countTitle = useRef(0);
  const countSubtitle = useRef(0);
  const [isFeatureFlagsSettingsButtonDisplayed, setIsFeatureFlagsSettingsButtonDisplayed] =
    useState<boolean>(false);

  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const skipOnboarding = useCallback(() => {
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    history.push("/settings");
  }, [dispatch, history]);

  const handleOpenFeatureFlagsDrawer = useCallback((nb: string) => {
    if (nb === "1") countTitle.current++;
    else if (nb === "2") countSubtitle.current++;
    if (countTitle.current > 3 && countSubtitle.current > 5) {
      countTitle.current = 0;
      countSubtitle.current = 0;
      setIsFeatureFlagsSettingsButtonDisplayed(true);
    }
    if (timeout.current) clearTimeout(timeout.current);
    timeout.current = setTimeout(() => {
      countTitle.current = 0;
      countSubtitle.current = 0;
    }, 1000);
  }, []);

  const handleAcceptTermsAndGetStarted = useCallback(() => {
    acceptTerms();
    history.push("/onboarding/select-device");
  }, [history]);

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

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
          <LdlsButton appearance="accent" icon={ArrowUp}>Click me</LdlsButton>
          <div className="text-warning flex items-center justify-between gap-2">
            <div>Some text</div>
            <ArrowUp size={40} />
          </div>
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
            onClick={_ => {
              isFeatureFlagsAnalyticsPrefDisplayed
                ? openAnalyticsOptInPrompt("Onboarding", handleAcceptTermsAndGetStarted)
                : handleAcceptTermsAndGetStarted();
            }}
            mb="5"
          >
            {t("onboarding.screens.welcome.nextButton")}
          </Button>
          <Button
            iconPosition="right"
            variant="main"
            onClick={_ => {
              isFeatureFlagsAnalyticsPrefDisplayed
                ? openAnalyticsOptInPrompt("Onboarding", buyNew)
                : buyNew();
            }}
            outline={true}
            flexDirection="column"
            whiteSpace="normal"
          >
            {t("onboarding.screens.welcome.buyLink")}
          </Button>
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
