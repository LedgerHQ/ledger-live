// @flow
import React, { Fragment, useCallback, useMemo } from "react";
import { StyleSheet, View, Image, Platform, FlatList } from "react-native";
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
      const showSeedWarning = [
        ScreenName.OnboardingRecoveryPhrase,
        ScreenName.OnboardingPairNew,
      ].includes(r);
      navigation.navigate(r, { ...route.params, next, showSeedWarning });
    },
    [navigation, route],
  );

  const useCases = useMemo(
    () =>
      Platform.OS === "ios" && deviceModelId !== "nanoX"
        ? [
            {
              key: "desktopSync",
              route: ScreenName.OnboardingImportAccounts,
              image: desktopSync,
              event: "Onboarding - Setup Import Accounts",
              showRecoveryWarning: true,
            },
          ]
        : [
            {
              route: ScreenName.OnboardingSetNewDeviceInfo,
              image: firstUse,
              event: "Onboarding - Setup new",
              key: "firstUse",
            },
            {
              route: ScreenName.OnboardingPairNew,
              image: devicePairing,
              next: ScreenName.OnboardingFinish,
              event: "Onboarding - Connect",
              key: "devicePairing",
              showRecoveryWarning: true,
            },
            {
              route: ScreenName.OnboardingImportAccounts,
              image: desktopSync,
              event: "Onboarding - Setup Import Accounts",
              key: "desktopSync",
            },
            {
              route: ScreenName.OnboardingRecoveryPhrase,
              image: restoreDevice,
              event: "Onboarding - Restore",
              key: "restoreDevice",
            },
          ],
    [deviceModelId],
  );
  return (
    <AnimatedHeaderView
      hasBackButton
      title={<Trans i18nKey="onboarding.stepUseCase.title" />}
    >
      <TrackScreen category="Onboarding" name="UseCase" />
      <FlatList
        data={useCases}
        renderItem={({ item, index }) => (
          <Fragment key={item.key + index}>
            {index < 2 && (
              <LText semiBold style={styles.subTitle}>
                <Trans i18nKey={`onboarding.stepUseCase.${item.key}.title`} />
              </LText>
            )}
            <Touchable
              event={item.event}
              eventProperties={{ deviceId: deviceModelId }}
              testID={`${item.event}|${deviceModelId}`}
              onPress={() => next(item)}
              style={[styles.button, { backgroundColor: colors.lightLive }]}
            >
              <>
                <LText semiBold style={[styles.label]} color="live">
                  <Trans i18nKey={`onboarding.stepUseCase.${item.key}.label`} />
                </LText>
                <LText semiBold style={styles.subTitle}>
                  <Trans
                    i18nKey={`onboarding.stepUseCase.${item.key}.subTitle`}
                  />
                </LText>
                <LText style={styles.desc}>
                  <Trans i18nKey={`onboarding.stepUseCase.${item.key}.desc`} />
                </LText>
                <View style={styles.imageContainer}>
                  {item.image && (
                    <Image
                      style={styles.image}
                      resizeMode="contain"
                      source={item.image}
                    />
                  )}
                </View>
              </>
            </Touchable>
            {index === 0 && useCases.length > 1 && (
              <View style={styles.separator}>
                <View style={[styles.line, { backgroundColor: colors.live }]} />
                <LText semiBold style={[styles.label, styles.or]} color="live">
                  <Trans i18nKey="onboarding.stepUseCase.or" />
                </LText>
                <View style={[styles.line, { backgroundColor: colors.live }]} />
              </View>
            )}
          </Fragment>
        )}
      />
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
