// @flow

import React, { Fragment, useCallback, useMemo } from "react";
import { StyleSheet, View, Image, Platform } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import LText from "../../../components/LText";

import firstUse from "../assets/firstUse.png";
import devicePairing from "../assets/devicePairing.png";
import desktopSync from "../assets/desktopSync.png";
import restoreDevice from "../assets/restoreDevice.png";

import Touchable from "../../../components/Touchable";
import AnimatedHeaderView from "../../../components/AnimatedHeader";
import { ScreenName } from "../../../const";

type Props = {
  navigation: *,
  route: { params: { deviceModelId: string } },
};

function OnboardingStepUseCaseSelection({ navigation, route }: Props) {
  const { colors } = useTheme();
  const { deviceModelId } = route.params;
  const next = useCallback(
    ({ route: r, next }: { route: string, next?: string }) => {
      navigation.navigate(r, { ...route.params, next });
    },
    [navigation, route],
  );

  const useCases = useMemo(
    () =>
      Platform.OS === "ios" && deviceModelId !== "nanoX"
        ? {
            desktopSync: {
              route: ScreenName.OnboardingImportAccounts,
              image: desktopSync,
              event: "Onboarding - Setup Import Accounts",
            },
          }
        : {
            firstUse: {
              route: ScreenName.OnboardingSetNewDeviceInfo,
              image: firstUse,
              event: "Onboarding - Setup new",
            },
            devicePairing: {
              route: ScreenName.OnboardingPairNew,
              image: devicePairing,
              next: ScreenName.OnboardingFinish,
              event: "Onboarding - Connect",
            },
            desktopSync: {
              route: ScreenName.OnboardingImportAccounts,
              image: desktopSync,
              event: "Onboarding - Setup Import Accounts",
            },
            restoreDevice: {
              route: ScreenName.OnboardingRecoveryPhrase,
              image: restoreDevice,
              event: "Onboarding - Restore",
            },
          },
    [],
  );

  return (
    <AnimatedHeaderView
      hasBackButton
      title={<Trans i18nKey="onboarding.stepUseCase.title" />}
    >
      <TrackScreen category="Onboarding" name="UseCase" />
      {Object.keys(useCases).map((c, index, arr) => (
        <Fragment key={c + index}>
          {index < 2 && (
            <LText semiBold style={styles.subTitle}>
              <Trans i18nKey={`onboarding.stepUseCase.${c}.title`} />
            </LText>
          )}
          <Touchable
            event={useCases[c].event}
            eventProperties={{ deviceId: deviceModelId }}
            onPress={() => next(useCases[c])}
            style={[styles.button, { backgroundColor: colors.lightLive }]}
          >
            <LText semiBold style={[styles.label]} color="live">
              <Trans i18nKey={`onboarding.stepUseCase.${c}.label`} />
            </LText>
            <LText semiBold style={styles.subTitle}>
              <Trans i18nKey={`onboarding.stepUseCase.${c}.subTitle`} />
            </LText>
            <LText style={styles.desc}>
              <Trans i18nKey={`onboarding.stepUseCase.${c}.desc`} />
            </LText>
            <View style={styles.imageContainer}>
              {useCases[c].image && (
                <Image
                  style={styles.image}
                  resizeMode="contain"
                  source={useCases[c].image}
                />
              )}
            </View>
          </Touchable>
          {index === 0 && arr.length > 1 && (
            <View style={styles.separator}>
              <View style={[styles.line, { backgroundColor: colors.live }]} />
              <LText semiBold style={[styles.label, styles.or]} color="live">
                <Trans i18nKey="onboarding.stepUseCase.or" />
              </LText>
              <View style={[styles.line, { backgroundColor: colors.live }]} />
            </View>
          )}
        </Fragment>
      ))}
    </AnimatedHeaderView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
  },
  title: {
    fontSize: 32,
    marginBottom: 8,
    paddingRight: 40,
  },
  scrollArea: {
    flex: 1,
    paddingBottom: 24,
    paddingHorizontal: 24,
  },
  button: {
    borderRadius: 4,
    padding: 24,
    marginVertical: 8,
  },
  label: { fontSize: 10, textTransform: "uppercase" },
  or: { marginHorizontal: 16 },
  subTitle: { fontSize: 16, marginVertical: 8 },
  desc: { fontSize: 13 },
  separator: {
    width: "100%",
    flexDirection: "row",
    alignItems: "center",
  },
  line: { flex: 1, height: 1 },
  imageContainer: {
    position: "relative",
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    maxHeight: 200,
    marginTop: 24,
  },
  image: {
    width: "100%",
    height: "100%",
  },
});

export default OnboardingStepUseCaseSelection;
