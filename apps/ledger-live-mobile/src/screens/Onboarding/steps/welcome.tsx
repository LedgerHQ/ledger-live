import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Text, Link as TextLink } from "@ledgerhq/native-ui";
import Video from "react-native-video";
import { Linking, StyleSheet } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useDispatch } from "react-redux";
import useFeature from "@ledgerhq/live-config/featureFlags/useFeature";
import { NavigatorName, ScreenName } from "~/const";
import StyledStatusBar from "~/components/StyledStatusBar";
import { urls } from "~/utils/urls";
import { useAcceptGeneralTerms } from "~/logic/terms";
import { setAnalytics } from "~/actions/settings";
import useIsAppInBackground from "~/components/useIsAppInBackground";
import ForceTheme from "~/components/theme/ForceTheme";
import Button from "~/components/wrappedUi/Button";
import { OnboardingNavigatorParamList } from "~/components/RootNavigator/types/OnboardingNavigator";
import { BaseComposite, StackNavigatorProps } from "~/components/RootNavigator/types/helpers";

import videoSources from "../../../../assets/videos";
import LanguageSelect from "../../SyncOnboarding/LanguageSelect";

const absoluteStyle = {
  position: "absolute" as const,
  bottom: 0,
  left: 0,
  top: 0,
  right: 0,
};

const SafeFlex = styled(SafeAreaView)`
  padding-top: 24px;
`;

type NavigationProps = BaseComposite<
  StackNavigatorProps<OnboardingNavigatorParamList, ScreenName.OnboardingWelcome>
>;

function OnboardingStepWelcome({ navigation }: NavigationProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const acceptTerms = useAcceptGeneralTerms();

  const {
    i18n: { language: locale },
  } = useTranslation();

  const onTermsLink = useCallback(
    () => Linking.openURL((urls.terms as Record<string, string>)[locale] || urls.terms.en),
    [locale],
  );

  const onPrivacyLink = useCallback(
    () =>
      Linking.openURL(
        (urls.privacyPolicy as Record<string, string>)[locale] || urls.privacyPolicy.en,
      ),
    [locale],
  );

  const next = useCallback(() => {
    acceptTerms();
    dispatch(setAnalytics(true));

    navigation.navigate({
      name: ScreenName.OnboardingPostWelcomeSelection,
      params: {
        userHasDevice: true,
      },
    });
  }, [acceptTerms, dispatch, navigation]);

  const videoMounted = !useIsAppInBackground();

  const countTitle = useRef(0);
  const countSubtitle = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleNavigateToFeatureFlagsSettings = useCallback(
    (nb: string) => {
      if (nb === "1") countTitle.current++;
      else if (nb === "2") countSubtitle.current++;
      if (countTitle.current > 3 && countSubtitle.current > 5) {
        countTitle.current = 0;
        countSubtitle.current = 0;
        navigation.navigate(NavigatorName.Base, {
          screen: NavigatorName.Settings,
          params: {
            screen: ScreenName.SettingsScreen,
          },
        });
      }
      if (timeout.current) clearTimeout(timeout.current);
      timeout.current = setTimeout(() => {
        countTitle.current = 0;
        countSubtitle.current = 0;
      }, 1000);
    },
    [navigation],
  );

  useEffect(() => {
    return () => {
      if (timeout.current) clearTimeout(timeout.current);
    };
  }, []);

  const videoSource = useFeature("staxWelcomeScreen")?.enabled
    ? videoSources.welcomeScreenStax
    : videoSources.welcomeScreen;

  return (
    <ForceTheme selectedPalette={"dark"}>
      <Flex flex={1} position="relative" bg="constant.purple">
        <StyledStatusBar barStyle="light-content" />
        {videoMounted && (
          <Video
            disableFocus
            source={videoSource}
            style={absoluteStyle}
            muted
            repeat
            resizeMode={"cover"}
          />
        )}
        <Svg
          style={{
            ...StyleSheet.absoluteFillObject,
            top: undefined,
            bottom: 0,
          }}
          width="100%"
          height="530"
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
              <Stop offset="0%" stopOpacity={0} stopColor="black" />
              <Stop offset="47%" stopOpacity={0.8} stopColor="black" />
              <Stop offset="100%" stopOpacity={0.8} stopColor="black" />
            </LinearGradient>
          </Defs>
          <Rect x="0" y="0" width="100%" height="100%" fill="url(#myGradient)" />
        </Svg>
        <Flex justifyContent="center" alignItems="center" flex={1} overflow="hidden">
          {/* @ts-expect-error Bindings for SafeAreaView are not written properly. */}
          <SafeFlex position="absolute" top={0} right={0}>
            <Flex pr={4}>
              <LanguageSelect />
            </Flex>
          </SafeFlex>
        </Flex>
        <Flex px={6} py={10}>
          <Text
            variant="large"
            color="neutral.c80"
            textAlign="center"
            pb={4}
            onPress={() => handleNavigateToFeatureFlagsSettings("1")}
            suppressHighlighting
          >
            {t("onboarding.stepWelcome.title")}
          </Text>
          <Text
            variant="h4"
            fontSize="27px"
            lineHeight="32px"
            textAlign="center"
            fontWeight="semiBold"
            pb={8}
            onPress={() => handleNavigateToFeatureFlagsSettings("2")}
            suppressHighlighting
          >
            {t("onboarding.stepWelcome.subtitle")}
          </Text>
          <Button
            type="main"
            size="large"
            onPress={next}
            mt={0}
            mb={7}
            testID="onboarding-getStarted-button"
          >
            {t("onboarding.stepWelcome.start")}
          </Button>
          <Text variant="small" textAlign="center" color="neutral.c100">
            {t("onboarding.stepWelcome.terms")}
          </Text>
          <Flex
            flexDirection="row"
            alignItems="baseline"
            justifyContent="center"
            flexWrap="wrap"
            pb={6}
          >
            <TextLink type="color" size={"small"} onPress={onTermsLink}>
              {t("onboarding.stepWelcome.termsLink")}
            </TextLink>
            <Text mx={2} variant="small" color="neutral.c100">
              {t("onboarding.stepWelcome.and")}
            </Text>
            <TextLink type="color" size={"small"} onPress={onPrivacyLink}>
              {t("onboarding.stepWelcome.privacyLink")}
            </TextLink>
          </Flex>
        </Flex>
      </Flex>
    </ForceTheme>
  );
}

export default OnboardingStepWelcome;
