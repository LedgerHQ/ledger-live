import React, { useCallback, useEffect, useRef } from "react";
import { useTranslation } from "react-i18next";
import styled from "styled-components/native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Flex, Text, Link as TextLink } from "@ledgerhq/native-ui";
import { ChevronBottomMedium } from "@ledgerhq/native-ui/assets/icons";
import Video from "react-native-video";
import { Linking } from "react-native";
import Svg, { Defs, LinearGradient, Rect, Stop } from "react-native-svg";
import { useDispatch } from "react-redux";
import { NavigatorName, ScreenName } from "../../../const";
import StyledStatusBar from "../../../components/StyledStatusBar";
import { urls } from "../../../config/urls";
import { useTermsAccept } from "../../../logic/terms";
import { setAnalytics } from "../../../actions/settings";
import useIsAppInBackground from "../../../components/useIsAppInBackground";
import InvertTheme from "../../../components/theme/InvertTheme";
import ForceTheme from "../../../components/theme/ForceTheme";
import Button from "../../../components/wrappedUi/Button";
import { OnboardingNavigatorParamList } from "../../../components/RootNavigator/types/OnboardingNavigator";
import {
  BaseComposite,
  StackNavigatorProps,
} from "../../../components/RootNavigator/types/helpers";

// eslint-disable-next-line @typescript-eslint/no-var-requires
const source = require("../../../../assets/videos/onboarding.mp4");

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
  StackNavigatorProps<
    OnboardingNavigatorParamList,
    ScreenName.OnboardingWelcome
  >
>;

function OnboardingStepWelcome({ navigation }: NavigationProps) {
  const dispatch = useDispatch();
  const { t } = useTranslation();
  const [, setAccepted] = useTermsAccept();

  const onLanguageSelect = useCallback(
    () => navigation.navigate(ScreenName.OnboardingLanguage),
    [navigation],
  );

  const {
    i18n: { language: locale },
  } = useTranslation();

  const onTermsLink = useCallback(
    () =>
      Linking.openURL(
        (urls.terms as Record<string, string>)[locale] || urls.terms.en,
      ),
    [locale],
  );

  const onPrivacyLink = useCallback(
    () =>
      Linking.openURL(
        (urls.privacyPolicy as Record<string, string>)[locale] ||
          urls.privacyPolicy.en,
      ),
    [locale],
  );

  const next = useCallback(() => {
    setAccepted();
    dispatch(setAnalytics(true));

    navigation.navigate(ScreenName.OnboardingDoYouHaveALedgerDevice);
  }, [setAccepted, dispatch, navigation]);

  const videoMounted = !useIsAppInBackground();

  const countTitle = useRef(0);
  const countSubtitle = useRef(0);
  const timeout = useRef<ReturnType<typeof setTimeout>>();

  const handleNavigateToFeatureFlagsSettings = useCallback(
    nb => {
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

  return (
    <ForceTheme selectedPalette={"dark"}>
      <Flex flex={1} position="relative" bg="constant.purple">
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
        <Svg style={absoluteStyle} width="100%" height="120%">
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
          <Rect
            x="0"
            y="0"
            width="100%"
            height="100%"
            fill="url(#myGradient)"
          />
        </Svg>
        <Flex
          justifyContent="center"
          alignItems="center"
          flex={1}
          overflow="hidden"
        >
          {/* @ts-expect-error Bindings for SafeAreaView are not written properly. */}
          <SafeFlex position="absolute" top={0} right={0}>
            <InvertTheme>
              <Button
                type={"main"}
                size="small"
                mr={4}
                Icon={ChevronBottomMedium}
                iconPosition="right"
                onPress={onLanguageSelect}
              >
                {locale.toLocaleUpperCase()}
              </Button>
            </InvertTheme>
          </SafeFlex>
        </Flex>
        <Flex px={6} py={10}>
          <Text
            variant="h1"
            color="neutral.c100"
            pb={3}
            style={{ textTransform: "uppercase" }}
            onPress={() => handleNavigateToFeatureFlagsSettings("1")}
            suppressHighlighting
          >
            {t("onboarding.stepWelcome.title")}
          </Text>
          <Text
            variant="large"
            fontWeight="medium"
            color="neutral.c80"
            pb={9}
            onPress={() => handleNavigateToFeatureFlagsSettings("2")}
            suppressHighlighting
          >
            {t("onboarding.stepWelcome.subtitle")}
          </Text>
          <Button
            type="main"
            size="large"
            event="Onboarding - Start"
            onPress={next}
            mb={7}
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
