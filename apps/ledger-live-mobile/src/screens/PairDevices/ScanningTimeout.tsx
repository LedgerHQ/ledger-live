import React from "react";
import { StyleSheet, View, Linking } from "react-native";
import { Trans } from "react-i18next";
import { getDeviceModel } from "@ledgerhq/devices";
import { useTheme } from "@react-navigation/native";
import { DeviceModelId } from "@ledgerhq/types-devices";
import { urls } from "~/utils/urls";
import { TrackScreen } from "~/analytics";
import Touchable from "~/components/Touchable";
import Button from "~/components/Button";
import LText from "~/components/LText";
import Circle from "~/components/Circle";
import NanoX from "~/icons/NanoX";
import Help from "~/icons/Help";

type Props = {
  onRetry: () => void;
};

function ScanningTimeout({ onRetry }: Props) {
  const { colors } = useTheme();
  return (
    <View style={styles.root}>
      <TrackScreen category="PairDevices" name="ScanningTimeout" />
      <View style={styles.body}>
        <Circle bg={colors.lightAlert} size={80}>
          <NanoX color={colors.alert} width={11} height={48} />
        </Circle>
        <LText secondary semiBold style={styles.titleText}>
          <Trans i18nKey="PairDevices.ScanningTimeout.title" />
        </LText>
        <LText style={styles.SubtitleText} color="smoke">
          <Trans
            i18nKey="PairDevices.ScanningTimeout.desc"
            values={getDeviceModel("nanoX" as DeviceModelId)}
          />
        </LText>

        <View style={styles.buttonContainer}>
          <Button
            event="PairDevicesTimeoutRetry"
            type="primary"
            title={<Trans i18nKey="common.retry" />}
            onPress={onRetry}
            containerStyle={[styles.button]}
          />
        </View>
        <Touchable
          event="NeedHelp"
          style={styles.helpContainer}
          onPress={() => Linking.openURL(urls.faq)}
        >
          <Help size={16} color={colors.live} />
          <LText style={styles.helpText} color="live" semiBold>
            <Trans i18nKey="common.needHelp" />
          </LText>
        </Touchable>
      </View>
    </View>
  );
}

export default ScanningTimeout;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding: 20,
    flexDirection: "column",
  },
  body: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "column",
  },
  titleText: {
    marginTop: 32,
    textAlign: "center",

    fontSize: 18,
  },
  SubtitleText: {
    marginTop: 16,
    textAlign: "center",
    fontSize: 14,
    lineHeight: 21,
  },
  buttonContainer: {
    flexDirection: "row",
    marginTop: 32,
  },
  button: {
    flex: 1,
  },
  helpContainer: {
    marginTop: 24,
    alignItems: "center",
    justifyContent: "center",
    flexDirection: "row",
  },
  helpText: {
    marginLeft: 6,
  },
});
