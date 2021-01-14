// @flow

import React, { useState, useEffect } from "react";
import { Trans } from "react-i18next";
import { useDispatch, useSelector } from "react-redux";
import {
  Image,
  View,
  StyleSheet,
  SafeAreaView,
  Animated,
  Easing,
} from "react-native";

import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import { completeOnboarding } from "../../../actions/settings";
import LText from "../../../components/LText";
import Button from "../../../components/Button";
import Animation from "../../../components/Animation";
import { useNavigationInterceptor } from "../onboardingContext";
import { NavigatorName } from "../../../const";

import { readOnlyModeEnabledSelector } from "../../../reducers/settings";
import confetti from "../assets/confetti.json";

const logo = <Image source={require("../../../images/logo.png")} />;

type Props = {
  navigation: any,
};

export default function OnboardingStepFinish({ navigation }: Props) {
  const { colors } = useTheme();
  const readOnlyModeEnabled = useSelector(readOnlyModeEnabledSelector);
  const dispatch = useDispatch();
  const { resetCurrentStep } = useNavigationInterceptor();

  const [progress] = useState(new Animated.Value(0));

  useEffect(() => {
    Animated.loop(
      Animated.timing(progress, {
        toValue: 1.0,
        duration: 8000,
        easing: Easing.linear,
        useNativeDriver: true,
        delay: 100,
      }),
    ).start();
  }, []);

  function onFinish(): void {
    dispatch(completeOnboarding());
    resetCurrentStep();

    const parentNav = navigation.dangerouslyGetParent();
    if (parentNav) {
      parentNav.popToTop();
    }

    navigation.navigate(NavigatorName.Base, {
      screen: NavigatorName.Main,
    });
  }

  return (
    <>
      <View
        style={[styles.confettiContainer, { backgroundColor: colors.live }]}
        pointerEvents="none"
      >
        <Animation
          progress={progress}
          style={{ width: "100%", height: "100%" }}
          source={confetti}
          autoplay={false}
          loop={false}
        />
      </View>
      <View
        style={[styles.confettiContainer, { zIndex: 2 }]}
        pointerEvents="none"
      >
        <Animation
          style={{ width: "130%", height: "130%" }}
          source={confetti}
        />
      </View>
      <SafeAreaView style={styles.wrapper}>
        <TrackScreen category="Onboarding" name="Finish" />

        <View style={styles.hero}>{logo}</View>
        <LText style={styles.title} secondary semiBold>
          <Trans
            i18nKey={
              readOnlyModeEnabled
                ? "onboarding.stepFinish.readOnlyTitle"
                : "onboarding.stepFinish.title"
            }
          />
        </LText>
        {!readOnlyModeEnabled && (
          <LText style={styles.desc}>
            <Trans i18nKey="onboarding.stepFinish.desc" />
          </LText>
        )}
        <View style={styles.buttonWrapper}>
          <Button
            event="OnboardingFinish"
            type="negativePrimary"
            containerStyle={styles.buttonContainer}
            title={<Trans i18nKey="onboarding.stepFinish.cta" />}
            onPress={onFinish}
          />
        </View>
      </SafeAreaView>
    </>
  );
}

const styles = StyleSheet.create({
  hero: {
    alignItems: "center",
  },
  onboardingLayout: { backgroundColor: "transparent" },
  confettiContainer: {
    position: "absolute",
    top: 0,
    left: 0,
    width: "100%",
    height: "100%",
  },
  wrapper: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    margin: 24,
    zIndex: 1,
  },
  buttonContainer: {
    flexGrow: 1,
  },
  buttonWrapper: {
    flexDirection: "row",
    width: "100%",
  },
  title: {
    marginTop: 24,
    marginBottom: 16,
    textAlign: "center",
    color: "#fff",
    fontSize: 16,
  },
  desc: {
    textAlign: "center",
    color: "#fff",
    fontSize: 14,
    marginBottom: 32,
  },
});
