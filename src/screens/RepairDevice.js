// @flow
import React, { Component } from "react";
import { View, StyleSheet, ScrollView, Dimensions } from "react-native";
import { SafeAreaView } from "react-navigation";
import i18next from "i18next";
import { translate, Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import firmwareUpdateRepair from "@ledgerhq/live-common/lib/hw/firmwareUpdate-repair";

import logger from "../logger";
import type { T } from "../types/common";
import Button from "../components/Button";
import { BulletItem } from "../components/BulletList";
import DeviceNanoAction from "../components/DeviceNanoAction";
import SelectDevice from "../components/SelectDevice";
import GenericErrorView from "../components/GenericErrorView";
import Installing from "../components/Installing";

import { connectingStep } from "../components/DeviceJob/steps";
import { TrackScreen } from "../analytics";
import colors from "../colors";

const forceInset = { bottom: "always" };

type Props = {
  navigation: NavigationScreenProp<*>,
  t: T,
};
type State = {
  ready: boolean,
  error: ?Error,
  progress: number,
  selected: boolean,
};

class RepairDevice extends Component<Props, State> {
  state = {
    error: null,
    progress: 0,
    ready: false,
    selected: false,
  };

  static navigationOptions = {
    title: i18next.t("RepairDevice.title"),
  };

  componentDidMount() {
    if (this.sub) this.sub.unsubscribe();
  }

  onReady = () => {
    this.setState({ ready: true });
  };

  onSelectDevice = meta => {
    this.setState({ selected: true });
    this.sub = firmwareUpdateRepair(meta.deviceId).subscribe({
      next: patch => {
        this.setState(patch);
      },
      complete: () => {
        this.props.navigation.goBack();
        this.props.navigation.navigate("Manager");
      },
      error: error => {
        logger.critical(error);
        this.setState({ error });
      },
    });
  };

  sub: *;

  render() {
    const { ready, progress, error, selected } = this.state;
    const width = Dimensions.get("window").width;

    let body = null;

    if (error) {
      body = <GenericErrorView error={error} />;
    } else if (selected) {
      body = <Installing progress={progress} installing="flash" />;
    } else if (ready) {
      body = (
        <ScrollView
          style={styles.body}
          contentContainerStyle={styles.bodyContent}
        >
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
              <DeviceNanoAction action="left" width={1.2 * width} />
            </View>
          </View>

          <Button
            type="primary"
            event="RepairDeviceReady"
            onPress={this.onReady}
            title={<Trans i18nKey="RepairDevice.action" />}
          />
        </ScrollView>
      );
    } else {
      body = (
        <SelectDevice onSelect={this.onSelectDevice} steps={[connectingStep]} />
      );
    }

    return (
      <SafeAreaView forceInset={forceInset} style={styles.root}>
        <TrackScreen category="Settings" name="RepairDevice" />
        {body}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    justifyContent: "center",
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    padding: 16,
    alignItems: "stretch",
  },
  step: {
    marginBottom: 32,
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
