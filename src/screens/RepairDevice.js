// @flow
import React, { Component } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import { SafeAreaView } from "react-navigation";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";

import type { T } from "../types/common";
import { BulletItem } from "../components/BulletList";
import DeviceNanoAction from "../components/DeviceNanoAction";
import SelectDevice from "../components/SelectDevice";
import {
  connectingStep,
  repairDeviceStep,
} from "../components/DeviceJob/steps";
import { TrackScreen } from "../analytics";
import colors from "../colors";

const forceInset = { bottom: "always" };

type Props = {
  navigation: NavigationScreenProp<*>,
  t: T,
};
type State = *;

class RepairDevice extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: "Repair Device",
  };

  goToManager = () => this.props.navigation.navigate("Manager");

  render() {
    const width = Dimensions.get("window").width;

    return (
      <SafeAreaView forceInset={forceInset} style={styles.root}>
        <TrackScreen category="Settings" name="RepairDevice" />
        <View style={styles.body}>
          <View style={styles.step}>
            <BulletItem
              index={0}
              value={<Trans i18nKey="FirmwareUpdateMCU.desc1" />}
            />
            <View style={styles.device}>
              <DeviceNanoAction width={1.2 * width} />
            </View>
          </View>

          <View style={styles.step}>
            <BulletItem
              index={1}
              value={<Trans i18nKey="FirmwareUpdateMCU.desc2" />}
            />
            <View style={styles.device}>
              <DeviceNanoAction powerAction width={1.2 * width} />
            </View>
          </View>
        </View>
        <SelectDevice
          onSelect={this.goToManager}
          steps={[connectingStep, repairDeviceStep]}
        />
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
  body: {
    padding: 20,
    flex: 1,
  },
  step: {
    flex: 1,
    justifyContent: "center",
    position: "relative",
  },
  device: {
    left: "10%",
    position: "relative",
  },
  description: {
    color: colors.smoke,
    fontSize: 14,
    marginVertical: 30,
  },
});

export default translate()(RepairDevice);
