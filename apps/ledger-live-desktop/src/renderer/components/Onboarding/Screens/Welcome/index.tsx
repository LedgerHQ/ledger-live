import React, { useCallback } from "react";
import { useHistory } from "react-router-dom";
import { useDispatch, useSelector } from "react-redux";
import { useTranslation } from "react-i18next";
import styled, { useTheme } from "styled-components";
import { openURL } from "~/renderer/linking";
import LangSwitcher from "~/renderer/components/Onboarding/LangSwitcher";
import Carousel from "~/renderer/components/Onboarding/Screens/Welcome/Carousel";
import { urls } from "~/config/urls";
import { Text, Button, Logos, Icons, InvertThemeV3 } from "@ledgerhq/react-ui";

import accessCrypto from "./assets/accessCrypto.png";
import ownPrivateKey from "./assets/ownPrivateKey.png";
import setupNano from "./assets/setupNano.svg";
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

const WelcomeContainer = styled.div`
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: row;
`;

const LeftContainer = styled.div`
  width: 386px;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  padding: 40px;
  z-index: 999;
`;

const Presentation = styled.div`
  display: flex;
  flex-direction: column;
`;

const ProductHighlight = styled.div`
  display: flex;
  flex-direction: column;
  margin-bottom: 4px;
`;

const TermsAndConditionsText = styled.div`
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  margin-top: 24px;
`;

const RightContainer = styled.div`
  height: 100%;
  display: flex;
  flex-grow: 1;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
  background-color: ${p => p.theme.colors.palette.constant.purple};
`;

const CarouselTopBar = styled.div`
  display: flex;
  justify-content: flex-end;
  align-items: center;
  padding: 40px;
  width: 100%;
`;

const Description = styled(Text)`
  white-space: pre-line;
`;

export function Welcome({}) {
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
    title: t(`v3.onboarding.screens.welcome.steps.${index}.title`),
    description: t(`v3.onboarding.screens.welcome.steps.${index}.desc`),
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
          <Text variant="h1" ff="Alpha|Medium" pt={"32px"} pb={"20px"}>
            {t("v3.onboarding.screens.welcome.title")}
          </Text>
          <Description variant="body" ff="Inter|Medium" fontSize={14}>
            {t("v3.onboarding.screens.welcome.description")}
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
            {t("v3.onboarding.screens.welcome.nextButton")}
          </Button>
          <Button iconPosition="right" variant="main" onClick={buyNanoX} outline={true}>
            {t("v3.onboarding.screens.welcome.buyLink")}
          </Button>
          <TermsAndConditionsText>
            <Text marginRight={2} color={colors.neutral.c80}>
              {t("v3.onboarding.screens.welcome.byTapping")}
            </Text>
            <StyledLink onClick={openTermsAndConditions} marginRight={2} color={colors.primary.c80}>
              {t("v3.onboarding.screens.welcome.termsAndConditions")}
            </StyledLink>
            <Text marginRight={2} color={colors.neutral.c80}>
              {t("v3.onboarding.screens.welcome.and")}
            </Text>
            <StyledLink onClick={openPrivacyPolicy} marginRight={2} color={colors.primary.c80}>
              {t("v3.onboarding.screens.welcome.privacyPolicy")}
            </StyledLink>
          </TermsAndConditionsText>
        </ProductHighlight>
      </LeftContainer>
      <RightContainer>
        <CarouselTopBar>
          {!!onboardingOrigin && (
            <Button small onClick={handlePrevious}>
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
