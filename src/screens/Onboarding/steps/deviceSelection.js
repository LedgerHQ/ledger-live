// @flow

import React, { useCallback } from "react";
import { StyleSheet, Image, View } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import { TrackScreen } from "../../../analytics";
import LText from "../../../components/LText";
import nanoS from "../assets/nanoS.png";
import nanoX from "../assets/nanoX.png";
import blue from "../assets/blue.png";

import Touchable from "../../../components/Touchable";
import { ScreenName } from "../../../const";
import AnimatedHeaderView from "../../../components/AnimatedHeader";

const deviceIds = { nanoS, nanoX, blue };

function OnboardingStepDeviceSelection({ navigation }: *) {
  const { colors } = useTheme();
  const next = useCallback(
    (deviceModelId: string) => {
      navigation.navigate(ScreenName.OnboardingUseCase, { deviceModelId });
    },
    [navigation],
  );

  return (
    <AnimatedHeaderView
      hasBackButton
      title={<Trans i18nKey="onboarding.stepSelectDevice.title" />}
    >
      <TrackScreen category="Onboarding" name="SelectDevice" />
      {Object.keys(deviceIds).map((deviceId, index) => (
        <Touchable
          key={deviceId + index}
          event="Onboarding Device - Selection"
          eventProperties={{ deviceId }}
          style={[styles.deviceButton, { backgroundColor: colors.lightLive }]}
          onPress={() => next(deviceId)}
        >
          <LText semiBold style={styles.label}>
            <Trans i18nKey={`onboarding.stepSelectDevice.${deviceId}`} />
          </LText>
          <View style={styles.imageContainer}>
            {deviceIds[deviceId] ? (
              <Image
                style={styles.bgImage}
                resizeMode="contain"
                source={deviceIds[deviceId]}
              />
            ) : null}
          </View>
        </Touchable>
      ))}
    </AnimatedHeaderView>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    paddingHorizontal: 24,
  },
  title: {
    fontSize: 32,
    marginBottom: 24,
    paddingRight: 40,
  },
  scrollArea: {
    flex: 1,
    paddingBottom: 24,
  },
  label: {
    fontSize: 22,
  },
  deviceButton: {
    height: 108,
    marginBottom: 16,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingLeft: 32,
    overflow: "hidden",
  },
  imageContainer: {
    height: 108,
    width: 150,
    position: "relative",
  },
  bgImage: {
    position: "absolute",
    bottom: 0,
    right: -10,
    width: 150,
    height: 90,
  },
});

export default OnboardingStepDeviceSelection;
