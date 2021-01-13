// @flow

import React, { useCallback, useState } from "react";
import { StyleSheet, View, Linking, Image } from "react-native";
import { Trans } from "react-i18next";

import { useClock, loop } from "react-native-redash/lib/module/v1";
import Animated, {
  set,
  interpolate,
  Extrapolate,
  useCode,
  Easing,
  multiply,
} from "react-native-reanimated";
import { useTheme } from "@react-navigation/native";
import Touchable from "../../../components/Touchable";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import { urls } from "../../../config/urls";
import { deviceNames } from "../../../wording";

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

  const [animY] = useState(new Animated.Value(0));

  const clockY = useClock();

  useCode(
    () =>
      set(
        animY,
        loop({
          duration: 10000,
          easing: Easing.inOut(Easing.ease),
          clock: clockY,
          boomerang: true,
        }),
      ),
    [],
  );

  const [animX] = useState(new Animated.Value(0));

  const clockX = useClock();

  useCode(
    () =>
      set(
        animX,
        loop({
          duration: 8000,
          easing: Easing.inOut(Easing.ease),
          clock: clockX,
          boomerang: true,
        }),
      ),
    [],
  );

  const translateY = interpolate(animX, {
    inputRange: [0, 1],
    outputRange: [-25, 5],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateX = interpolate(animY, {
    inputRange: [0, 1],
    outputRange: [-10, 10],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateY1 = interpolate(multiply(animX, -1), {
    inputRange: [0, 1],
    outputRange: [-10, 15],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateX2 = interpolate(animY, {
    inputRange: [0, 1],
    outputRange: [-5, 5],
    extrapolate: Extrapolate.CLAMP,
  });

  const translateY2 = interpolate(animX, {
    inputRange: [0, 1],
    outputRange: [15, -20],
    extrapolate: Extrapolate.CLAMP,
  });

  return (
    <View style={[styles.root, { backgroundColor: colors.white }]}>
      <View style={styles.header} />
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
            <Trans i18nKey="onboarding.stepWelcome.title" />
          </LText>
          <LText style={[styles.subTitle]} color="grey">
            <Trans i18nKey="onboarding.stepWelcome.subtitle" />
          </LText>
        </View>

        <Button
          type="primary"
          event="Onboarding - Start"
          onPress={next}
          title={<Trans i18nKey="onboarding.stepWelcome.start" />}
        />
        <View style={commonStyles.footer}>
          <LText style={styles.subTitle} color="grey">
            <Trans i18nKey="onboarding.stepWelcome.noDevice" />
          </LText>
          <Touchable
            event="WelcomeBuy"
            onPress={buy}
            style={styles.buyTouch}
            hitSlop={hitSlop}
          >
            <LText semiBold style={[styles.subTitle, styles.buy]} color="live">
              <Trans
                i18nKey="onboarding.stepWelcome.buy"
                values={deviceNames.nanoX}
              />
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
