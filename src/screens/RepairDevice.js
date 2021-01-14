// @flow
import React, { Component } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import firmwareUpdateRepair from "@ledgerhq/live-common/lib/hw/firmwareUpdate-repair";

import { NavigatorName } from "../const";
import logger from "../logger";
import Button from "../components/Button";
import { BulletItem } from "../components/BulletList";
import DeviceNanoAction from "../components/DeviceNanoAction";
import SelectDevice from "../components/SelectDevice";
import GenericErrorView from "../components/GenericErrorView";
import Installing from "../components/Installing";
import NavigationScrollView from "../components/NavigationScrollView";

import { connectingStep } from "../components/DeviceJob/steps";
import { TrackScreen } from "../analytics";
import { withTheme } from "../colors";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  colors: *,
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

  componentDidMount() {
    if (this.sub) this.sub.unsubscribe();
  }

  onReady = () => {
    this.setState({ ready: true });
  };

  onSelectDevice = (meta: any) => {
    this.setState({ selected: true });
    this.sub = firmwareUpdateRepair(meta.deviceId).subscribe({
      next: patch => {
        this.setState(patch);
      },
      complete: () => {
        this.props.navigation.goBack();
        this.props.navigation.navigate(NavigatorName.Manager);
      },
      error: error => {
        logger.critical(error);
        this.setState({ error });
      },
    });
  };

  sub: any;

  render() {
    const { colors } = this.props;
    const { ready, progress, error, selected } = this.state;
    const width = Dimensions.get("window").width;

    let body = null;

    if (error) {
      body = <GenericErrorView error={error} />;
    } else if (selected) {
      body = <Installing progress={progress} installing="flash" />;
    } else if (ready) {
      body = (
        <NavigationScrollView
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
        </NavigationScrollView>
      );
    } else {
      body = (
        <SelectDevice onSelect={this.onSelectDevice} steps={[connectingStep]} />
      );
    }

    return (
      <SafeAreaView
        forceInset={forceInset}
        style={[styles.root, { backgroundColor: colors.white }]}
      >
        <TrackScreen category="Settings" name="RepairDevice" />
        {body}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
});

export default withTheme(RepairDevice);
