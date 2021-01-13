/* @flow */
import React, { Component } from "react";
import { View, StyleSheet } from "react-native";
import SafeAreaView from "react-native-safe-area-view";
import { Trans } from "react-i18next";
import firmwareUpdateMain from "@ledgerhq/live-common/lib/hw/firmwareUpdate-main";
import type { FirmwareUpdateContext } from "@ledgerhq/live-common/lib/types/manager";
import logger from "../../logger";
import { TrackScreen } from "../../analytics";
import { ScreenName } from "../../const";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import { BulletItem } from "../../components/BulletList";
import getWindowDimensions from "../../logic/getWindowDimensions";
import Installing from "../../components/Installing";
import { withTheme } from "../../colors";

const forceInset = { bottom: "always" };

type Props = {
  navigation: any,
  route: { params: RouteParams },
  colors: *,
};

type RouteParams = {
  deviceId: string,
  firmware: FirmwareUpdateContext,
};

type State = {
  installing: ?string,
  progress: number,
};

class FirmwareUpdateMCU extends Component<Props, State> {
  state = {
    installing: null,
    progress: 0,
  };

  sub: *;

  async componentDidMount() {
    const { navigation, route } = this.props;
    const { deviceId, firmware } = this.props.route.params || {};

    this.sub = firmwareUpdateMain(deviceId, firmware).subscribe({
      next: patch => {
        this.setState(patch);
      },
      complete: () => {
        if (navigation.replace) {
          navigation.replace(
            ScreenName.FirmwareUpdateConfirmation,
            route.params,
          );
        }
      },
      error: error => {
        logger.critical(error);
        if (navigation.replace) {
          navigation.replace(ScreenName.FirmwareUpdateFailure, {
            ...route.params,
            error,
          });
        }
      },
    });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  render() {
    const { colors } = this.props;
    const { installing, progress } = this.state;
    const { width } = getWindowDimensions();

    return (
      <SafeAreaView
        style={[styles.root, { backgroundColor: colors.background }]}
        forceInset={forceInset}
      >
        <TrackScreen category="FirmwareUpdate" name="MCU" />
        {installing ? (
          <Installing progress={progress} installing={installing} />
        ) : (
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
                <DeviceNanoAction action="left" width={1.2 * width} />
              </View>
            </View>
          </View>
        )}
      </SafeAreaView>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
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
});

export default withTheme(FirmwareUpdateMCU);
