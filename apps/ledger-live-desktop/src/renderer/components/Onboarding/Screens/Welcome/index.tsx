import { FeatureToggle, useFeature } from "@ledgerhq/live-common/featureFlags/index";
import { useLoginPath } from "@ledgerhq/live-common/hooks/recoverFeatureFlag";
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
import { acceptTerms, useDynamicUrl } from "~/renderer/terms";
import BuyNanoX from "./assets/buyNanoX.webm";

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
  zIndex: 999,
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
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();
  const { colors } = useTheme();

  useEffect(() => {
    if (hasCompletedOnboarding) {
      history.push("/onboarding/select-device");
    }
  }, [hasCompletedOnboarding, history]);

  const recoverFeature = useFeature("protectServicesDesktop");
  const loginPath = useLoginPath(recoverFeature);

  const recoverLogIn = useCallback(() => {
    if (!loginPath) return;

    acceptTerms();
    dispatch(saveSettings({ hasCompletedOnboarding: true }));
    history.push(loginPath);
  }, [dispatch, history, loginPath]);

  const urlBuyNew = useDynamicUrl("buyNew");
  const buyNanoX = () => openURL(urlBuyNew);

  const urlTerms = useDynamicUrl("terms");
  const openTermsAndConditions = () => openURL(urlTerms);

  const urlPrivacyPolicy = useDynamicUrl("privacyPolicy");
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

  const handleOpenFeatureFlagsDrawer = useCallback(nb => {
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

  return (
    <WelcomeContainer>
      <LeftContainer>
        <Presentation>
          <Logos.LedgerLiveRegular color={colors.neutral.c100} />
          <Text variant="h1" pt={10} pb={7} onClick={() => handleOpenFeatureFlagsDrawer("1")}>
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
            data-test-id="v3-onboarding-get-started-button"
            iconPosition="right"
            Icon={IconsLegacy.ArrowRightMedium}
            variant="main"
            onClick={handleAcceptTermsAndGetStarted}
            mb="5"
          >
            {t("onboarding.screens.welcome.nextButton")}
          </Button>
          <FeatureToggle featureId="protectServicesDesktop">
            <Button
              iconPosition="right"
              variant="main"
              onClick={recoverLogIn}
              outline={true}
              flexDirection="column"
              whiteSpace="normal"
              mb="5"
            >
              {t("onboarding.screens.welcome.recoverSignIn")}
            </Button>
          </FeatureToggle>
          <Button
            iconPosition="right"
            variant="main"
            onClick={buyNanoX}
            outline={true}
            flexDirection="column"
            whiteSpace="normal"
          >
            {t("onboarding.screens.welcome.buyLink")}
          </Button>
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
      </RightContainer>
    </WelcomeContainer>
  );
}
