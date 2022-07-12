import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { openURL } from "~/renderer/linking";
import LangSwitcher from "~/renderer/components/Onboarding/LangSwitcher";
import Carousel from "~/renderer/components/Onboarding/Screens/Welcome/Carousel";
import { urls } from "~/config/urls";
import { Text, Button, Logos, Icons, InvertThemeV3, Flex } from "@ledgerhq/react-ui";

import accessCrypto from "./assets/accessCrypto.png";
import ownPrivateKey from "./assets/ownPrivateKey.png";
import setupNano from "./assets/setupNano.png";
import stayOffline from "./assets/stayOffline.png";
import validateTransactions from "./assets/validateTransactions.png";

import { registerAssets } from "~/renderer/components/Onboarding/preloadAssets";

import { relaunchOnboarding } from "~/renderer/actions/onboarding";
import { onboardingRelaunchedSelector } from "~/renderer/reducers/application";
import { languageSelector } from "~/renderer/reducers/settings";

const stepLogos = [accessCrypto, ownPrivateKey, stayOffline, validateTransactions, setupNano];
registerAssets(stepLogos);

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

const Presentation = styled(Flex).attrs({flexDirection: "column"})``;

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
})``;

const Description = styled(Text)`
  white-space: pre-line;
`;

export function Welcome() {
  const onboardingOrigin = useSelector(onboardingRelaunchedSelector) ? "/settings/help" : undefined;
  const { t } = useTranslation();
  const history = useHistory();
  const dispatch = useDispatch();
  const { colors } = useTheme();
  const locale = useSelector(languageSelector) || "en";

  const buyNanoX = useCallback(() => {
    openURL(urls.noDevice.buyNew);
  }, []);

  const openTermsAndConditions = useCallback(() => {
    openURL(urls.terms[locale in urls.terms ? locale : "en"]);
  }, []);

  const openPrivacyPolicy = useCallback(() => {
    openURL(urls.privacyPolicy[locale in urls.privacyPolicy ? locale : "en"]);
  }, []);

  const steps = stepLogos.map((logo, index) => ({
    image: logo,
    title: t(`onboarding.screens.welcome.steps.${index}.title`),
    description: t(`onboarding.screens.welcome.steps.${index}.desc`),
    isLast: index === stepLogos.length - 1,
  }));

  const handlePrevious = useCallback(() => {
    if (onboardingOrigin) {
      history.push(onboardingOrigin);
      dispatch(relaunchOnboarding(false));
    }
  }, [history, onboardingOrigin, dispatch]);

  return (
    <WelcomeContainer>
      <LeftContainer>
        <Presentation>
          <Logos.LedgerLiveRegular color={colors.neutral.c100} />
          <Text variant="h1" pt={10} pb={7}>
            {t("onboarding.screens.welcome.title")}
          </Text>
          <Description variant="body">
            {t("onboarding.screens.welcome.description")}
          </Description>
        </Presentation>
        <ProductHighlight>
          <Button
            data-test-id="v3-onboarding-get-started-button"
            iconPosition="right"
            Icon={Icons.ArrowRightMedium}
            variant="main"
            onClick={() => history.push("/onboarding/select-device")}
            mb="24px"
          >
            {t("onboarding.screens.welcome.nextButton")}
          </Button>
          <Button iconPosition="right" variant="main" onClick={buyNanoX} outline={true}>
            {t("onboarding.screens.welcome.buyLink")}
          </Button>
          <TermsAndConditionsContainer>
            <TermsAndConditionsText>
              {t("onboarding.screens.welcome.byTapping")}{" "}
              <StyledLink onClick={openTermsAndConditions} marginRight={2} color={colors.primary.c80}>
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
          {!!onboardingOrigin && (
            <Button size="small" onClick={handlePrevious}>
              {t("common.previous")}
            </Button>
          )}
          {colors.palette.type === "dark" ? (
            <InvertThemeV3>
              <LangSwitcher />
            </InvertThemeV3>
          ) : (
            <LangSwitcher />
          )}
        </CarouselTopBar>
        <Carousel queue={steps} />
      </RightContainer>
    </WelcomeContainer>
  );
}
