// @flow

import React, { PureComponent } from "react";
import { StyleSheet, View } from "react-native";
import { Trans } from "react-i18next";
import LottieView from "lottie-react-native";
import Config from "react-native-config";
import { getDeviceModel } from "@ledgerhq/devices";
import getWindowDimensions from "../../logic/getWindowDimensions";
import BulletList from "../../components/BulletList";
import { TrackScreen } from "../../analytics";

class PendingPairing extends PureComponent<*> {
  render() {
    const deviceWording = getDeviceModel("nanoX");
    return (
      <View style={styles.root}>
        <TrackScreen category="PairDevices" name="PendingPairing" />
        <LottieView
          style={styles.anim}
          source={require("../../animations/pairing.json")}
          autoPlay={!Config.MOCK}
          loop
        />
        <View style={styles.list}>
          <BulletList
            animated
            list={[
              <Trans
                i18nKey="PairDevices.Pairing.step1"
                values={deviceWording}
              />,
              <Trans
                i18nKey="PairDevices.Pairing.step2"
                values={deviceWording}
              />,
            ]}
          />
        </View>
      </View>
    );
  }
}

const padding = 16;

const styles = StyleSheet.create({
  root: {
    flex: 1,
    padding,
    justifyContent: "center",
    alignItems: "center",
  },
  anim: {
    width: getWindowDimensions().width - 2 * padding,
  },
  list: {
    padding: 16,
  },
});

export default PendingPairing;
