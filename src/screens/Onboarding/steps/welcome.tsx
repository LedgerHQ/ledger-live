import React, { useCallback } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Text, Link as TextLink } from "@ledgerhq/native-ui";
import { ChevronBottomMedium } from "@ledgerhq/native-ui/assets/icons";
import Video from "react-native-video";
import { Linking } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useDispatch } from "react-redux";
import Button from "../../../components/Button";
import { useLocale } from "../../../context/Locale";
import { ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";
import { urls } from "../../../config/urls";
import { useTermsAccept } from "../../../logic/terms";
import { setAnalytics } from "../../../actions/settings";
import useIsAppInBackground from "../../../components/useIsAppInBackground";

const source = require("../../../../assets/videos/onboarding.mp4");

const absoluteStyle = {
  position: "absolute",
  bottom: 0,
  left: 0,
  top: 0,
  right: 0,
};

const SafeFlex = styled(SafeAreaView)`
  padding-top: 24px;
`;

function OnboardingStepWelcome({ navigation }: any) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [, setAccepted] = useTermsAccept();

  const onLanguageSelect = useCallback(
    () => navigation.navigate(ScreenName.OnboardingLanguage),
    [navigation],
  );

  const { locale } = useLocale();

  const onTermsLink = useCallback(
    () =>
      Linking.openURL(
        (urls.terms as Record<string, string>)[locale] || urls.terms.en,
      ),
    [locale],
  );

  const onPrivacyLink = useCallback(
    () => Linking.openURL(urls.privacyPolicy[locale]),
    [locale],
  );

  const next = useCallback(() => {
    // TODO: Remove this stupid type check as soon as we convert useTermsAccept to TS
    if (typeof setAccepted !== "boolean") setAccepted();
    dispatch(setAnalytics(true));

    // TODO: FIX @react-navigation/native using Typescript
    // @ts-ignore next-line
    navigation.navigate({ name: ScreenName.OnboardingPostWelcomeSelection });
  }, [setAccepted, dispatch, navigation]);

  const videoMounted = !useIsAppInBackground();

  return (
    <Flex flex={1} position="relative" bg="constant.black">
      <StyledStatusBar barStyle="light-content" />
      {videoMounted && (
        <Video
          disableFocus
          source={source}
          style={absoluteStyle}
          muted
          repeat
          resizeMode={"cover"}
        />
      )}
      <Svg
        style={absoluteStyle}
        width="100%"
        height="120%"
        preserveAspectRatio="xMinYMin slice"
      >
        <Defs>
          <LinearGradient
            id="myGradient"
            x1="0%"
            y1="0%"
            x2="0%"
            y2="100%"
            gradientUnits="userSpaceOnUse"
          >
            <Stop offset="30%" stopOpacity={0} stopColor="black" />
            <Stop offset="100%" stopOpacity={0.8} stopColor="black" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
      </Svg>
      <Flex
        justifyContent="center"
        alignItems="center"
        flex={1}
        overflow="hidden"
      >
        <SafeFlex position="absolute" top={0} right={0}>
          <Button
            type="primary"
            size="small"
            mr={4}
            Icon={ChevronBottomMedium}
            iconPosition="right"
            title={locale.toLocaleUpperCase()}
            outline={false}
            onPress={onLanguageSelect}
          />
        </SafeFlex>
      </Flex>
      <Flex px={6} py={10}>
        <Text
          variant="h1"
          color="constant.white"
          pb={2}
          style={{ textTransform: "uppercase" }}
        >
          {t("onboarding.stepWelcome.title")}
        </Text>
        <Text variant="body" color="constant.white" pb={10}>
          {t("onboarding.stepWelcome.subtitle")}
        </Text>
        <Button
          type="default"
          containerStyle={{ backgroundColor: "white" }}
          outline={false}
          size="large"
          event="Onboarding - Start"
          onPress={next}
          mb={8}
        >
          <Text
            variant="large"
            color="constant.black"
            flex={1}
            textAlign="center"
            fontWeight="semiBold"
          >
            {t("onboarding.stepWelcome.start")}
          </Text>
        </Button>

        <Text
          variant="body"
          textAlign="center"
          lineHeight="22px"
          color="constant.white"
        >
          {t("onboarding.stepWelcome.terms")}
        </Text>
        <Flex
          flexDirection="row"
          alignItems="baseline"
          justifyContent="center"
          pb={6}
        >
          <TextLink type="color" onPress={onTermsLink}>
            {t("onboarding.stepWelcome.termsLink")}
          </TextLink>
          <Text mx={2} variant="body" color="constant.white">
            {t("onboarding.stepWelcome.and")}
          </Text>
          <TextLink type="color" onPress={onPrivacyLink}>
            {t("onboarding.stepWelcome.privacyLink")}
          </TextLink>
        </Flex>
      </Flex>
    </Flex>
  );
}

export default OnboardingStepWelcome;
