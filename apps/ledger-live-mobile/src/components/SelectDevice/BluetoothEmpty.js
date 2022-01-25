// @flow

import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import { useTheme } from "@react-navigation/native";
import Button from "../Button";

import lottie from "../../screens/Onboarding/assets/nanoX/pairDevice/data.json";

import LText from "../LText";
import Animation from "../Animation";
import Bluetooth from "../../icons/Bluetooth";

type Props = {
  onPairNewDevice: () => void,
};

function BluetoothEmpty({ onPairNewDevice }: Props) {
  const { colors } = useTheme();
  return (
    <>
      <View style={styles.imageContainer}>
        <Animation source={lottie} style={styles.image} />
      </View>
      <View style={styles.bulletLine}>
        <View
          style={[styles.bulletIcon, { backgroundColor: colors.lightLive }]}
        >
          <Bluetooth size={10} color={colors.live} />
        </View>
        <View style={styles.bulletTextContainer}>
          <LText
            semiBold
            style={[styles.bulletTitle, { color: colors.darkBlue }]}
          >
            <Trans i18nKey="SelectDevice.bluetooth.title" />
          </LText>
          <LText style={[styles.label, { color: colors.darkBlue }]}>
            <Trans i18nKey="SelectDevice.bluetooth.label" />
          </LText>
        </View>
      </View>
      <Button
        event="PairDevice"
        type="primary"
        title={<Trans i18nKey="SelectDevice.deviceNotFoundPairNewDevice" />}
        onPress={onPairNewDevice}
      />
    </>
  );
}

const styles = StyleSheet.create({
  imageContainer: {
    minHeight: 200,
    position: "relative",
    overflow: "visible",
  },
  image: {
    position: "absolute",
    left: "5%",
    top: 0,
    width: "110%",
    height: "100%",
  },
  label: { fontSize: 13, lineHeight: 24 },
  bulletIcon: {
    width: 24,
    height: 24,
    alignItems: "center",
    justifyContent: "center",
    borderRadius: 24,
  },
  bulletLine: {
    flexDirection: "row",
    alignItems: "flex-start",
    justifyContent: "center",
    marginVertical: 24,
  },
  bulletTextContainer: {
    flexDirection: "column",
    alignContent: "flex-start",
    justifyContent: "flex-start",
    flexShrink: 1,
    marginLeft: 20,
  },
  bulletTitle: {
    fontSize: 16,
    lineHeight: 24,
  },
});

export default memo<Props>(BluetoothEmpty);
