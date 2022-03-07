// @flow

import React, { useCallback, useState } from "react";
import {
  StyleSheet,
  View,
  Linking,
  Image,
  TouchableOpacity,
} from "react-native";
import { useTranslation } from "react-i18next";

import { useClock, loop } from "react-native-redash/lib/module/v1";
import Animated, {
  set,
  interpolateNode,
  Extrapolate,
  useCode,
  EasingNode,
  multiply,
} from "react-native-reanimated";
import Config from "react-native-config";
import { useTheme } from "@react-navigation/native";
import Touchable from "../../../components/Touchable";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import { urls } from "../../../config/urls";
import { deviceNames } from "../../../wording";
import ArrowDown from "../../../icons/Chevron";

import commonStyles from "../styles";

import welcomeBg from "../assets/welcomeIllu/1.png";
import welcomeLogoLayer1 from "../assets/welcomeIllu/2.png";
import welcomeLogoLayer2 from "../assets/welcomeIllu/3.png";
import welcomeLogoLayer3 from "../assets/welcomeIllu/4.png";

import { ScreenName } from "../../../const";

const AnimatedImg = Animated.createAnimatedComponent(Image);

const hitSlop = {
  top: 16,
  left: 16,
  right: 16,
  bottom: 16,
};

function OnboardingStepWelcome({ navigation }: *) {
  const { colors } = useTheme();
  const buy = useCallback(() => Linking.openURL(urls.buyNanoX), []);

  const next = useCallback(
    () => navigation.navigate(ScreenName.OnboardingTermsOfUse),
    [navigation],
  );

  const onLanguageSelect = useCallback(
    () => navigation.navigate(ScreenName.OnboardingLanguage),
    [navigation],
  );

  const [animY] = useState(new Animated.Value(0));

  const clockY = useClock();

  useCode(
    () =>
      !Config.MOCK
        ? set(
            animY,
            loop({
              duration: 10000,
              easing: EasingNode.inOut(EasingNode.ease),
              clock: clockY,
              boomerang: true,
            }),
          )
        : undefined,
    [],
  );

  const [animX] = useState(new Animated.Value(0));

  const clockX = useClock();

  useCode(
    () =>
      !Config.MOCK
        ? set(
            animX,
            loop({
              duration: 8000,
              easing: EasingNode.inOut(EasingNode.ease),
              clock: clockX,
              boomerang: true,
            }),
          )
        : undefined,
    [],
  );

  const translateY = interpolateNode(animX, {
    inputRange: [0, 1],
    outputRange: [-25, 5],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateX = interpolateNode(animY, {
    inputRange: [0, 1],
    outputRange: [-10, 10],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateY1 = interpolateNode(multiply(animX, -1), {
    inputRange: [0, 1],
    outputRange: [-10, 15],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateX2 = interpolateNode(animY, {
    inputRange: [0, 1],
    outputRange: [-5, 5],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateY2 = interpolateNode(animX, {
    inputRange: [0, 1],
    outputRange: [15, -20],
    extrapolate: Extrapolate.CLAMP,
  });

  const { t, i18n } = useTranslation();

  return (
    <View style={[styles.root, { backgroundColor: colors.background }]}>
      <View style={styles.header}>
        <TouchableOpacity
          style={[styles.languageButton, { borderColor: colors.fog }]}
          onPress={onLanguageSelect}
        >
          <LText semiBold style={styles.languageLabel}>
            {i18n.language}
          </LText>
          <ArrowDown size={10} color={colors.darkBlue} />
        </TouchableOpacity>
      </View>
      <View style={styles.logo}>
        <Image style={[styles.bgImage]} resizeMode="cover" source={welcomeBg} />
        <AnimatedImg
          style={[
            styles.bgImageLayer,
            styles.bgImageLayer1,
            { transform: [{ translateY }] },
          ]}
          resizeMode="contain"
          source={welcomeLogoLayer1}
        />
        <AnimatedImg
          style={[
            styles.bgImageLayer,
            styles.bgImageLayer2,
            {
              transform: [{ translateY: translateY1, translateX }],
            },
          ]}
          resizeMode="contain"
          source={welcomeLogoLayer2}
        />
        <AnimatedImg
          style={[
            styles.bgImageLayer,
            styles.bgImageLayer3,
            {
              transform: [{ translateY: translateY2, translateX: translateX2 }],
            },
          ]}
          resizeMode="contain"
          source={welcomeLogoLayer3}
        />
      </View>
      <View style={styles.bottomSection}>
        <View style={styles.titleSection}>
          <LText bold style={styles.title}>
            {t("onboarding.stepWelcome.title")}
          </LText>
          <LText style={[styles.subTitle]} color="grey">
            {t("onboarding.stepWelcome.subtitle")}
          </LText>
        </View>

        <Button
          type="primary"
          event="Onboarding - Start"
          onPress={next}
          title={t("onboarding.stepWelcome.start")}
        />
        <View style={commonStyles.footer}>
          <LText style={styles.subTitle} color="grey">
            {t("onboarding.stepWelcome.noDevice")}
          </LText>
          <Touchable
            event="WelcomeBuy"
            onPress={buy}
            style={styles.buyTouch}
            hitSlop={hitSlop}
          >
            <LText semiBold style={[styles.subTitle, styles.buy]} color="live">
              {t("onboarding.stepWelcome.buy", deviceNames.nanoX)}
            </LText>
          </Touchable>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 0,
  },
  header: {
    ...commonStyles.header,
    backgroundColor: "transparent",
    flexDirection: "row-reverse",
    zIndex: 10,
  },
  bgImage: {
    width: "100%",
    height: "120%",
    position: "absolute",
    top: -100,
    left: 0,
    zIndex: -10,
  },
  bgImageLayer: {
    width: "105%",
    height: "120%",
    position: "absolute",
    top: -100,
    left: "-5%",
  },
  bgImageLayer1: {
    zIndex: -9,
  },
  bgImageLayer2: {
    zIndex: -8,
  },
  bgImageLayer3: {
    zIndex: -7,
  },
  logo: {
    flex: 1,
    padding: 0,
  },
  languageButton: {
    paddingHorizontal: 16,
    borderRadius: 32,
    height: 34,
    width: "auto",
    flexDirection: "row",
    borderWidth: 1,
    alignItems: "center",
  },
  languageLabel: { fontSize: 10, marginRight: 8, textTransform: "uppercase" },
  bottomSection: { flex: 1, padding: 24, justifyContent: "flex-start" },
  titleSection: { flex: 1, justifyContent: "center" },
  title: {
    fontSize: 28,
    textAlign: "center",
    marginBottom: 4,
  },
  subTitle: {
    fontSize: 13,
    lineHeight: 22,
    textAlign: "center",
  },
  subTitlePadding: { paddingHorizontal: 60 },
  sub: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    marginTop: 24,
  },
  buy: {
    marginLeft: 5,
  },
  buyTouch: {
    flexDirection: "row",
    alignItems: "center",
  },
});

export default OnboardingStepWelcome;
