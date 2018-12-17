/* @flow */
/* eslint-disable no-console */
import React, { Component } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { from, throwError, concat, empty } from "rxjs";
import { concatMap, delay, catchError, filter } from "rxjs/operators";
import { translate, Trans } from "react-i18next";
import { CantOpenDevice } from "@ledgerhq/live-common/lib/errors";
import { TrackScreen } from "../../analytics";
import flash from "../../logic/hw/flash";
import installFinalFirmware from "../../logic/hw/installFinalFirmware";
import getDeviceInfo from "../../logic/hw/getDeviceInfo";
import { withDevice, withDevicePolling } from "../../logic/hw/deviceAccess";
import type { FinalFirmware } from "../../types/manager";
import colors from "../../colors";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import StepHeader from "../../components/StepHeader";
import { BulletItem } from "../../components/BulletList";
import Installing from "./Installing";

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
    latestFirmware: ?FinalFirmware,
  },
}>;

type Props = {
  navigation: Navigation,
};

type State = {
  installing: ?string,
  progress: number,
};

const ignoreDeviceDisconnectedError = catchError(
  e => (e instanceof CantOpenDevice ? from([]) : throwError(e)),
);

class FirmwareUpdateMCU extends Component<Props, State> {
  static navigationOptions = {
    headerLeft: null,
    headerTitle: (
      <StepHeader
        subtitle={<Trans i18nKey="FirmwareUpdate.title" />}
        title={<Trans i18nKey="FirmwareUpdateMCU.title" />}
      />
    ),
  };

  state = {
    installing: null,
    progress: 0,
  };

  sub: *;

  async componentDidMount() {
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    const latestFirmware = navigation.getParam("latestFirmware");

    const withDeviceInfo = withDevicePolling(deviceId)(
      transport => from(getDeviceInfo(transport)),
      () => true, // accept all errors. we're waiting forever condition that make getDeviceInfo work
    );

    const withDeviceInstall = install =>
      withDevice(deviceId)(install).pipe(
        ignoreDeviceDisconnectedError, // this can happen if withDevicePolling was still seeing the device but it was then interrupted by a device reboot
      );

    const wait2s = from([{ type: "wait" }]).pipe(delay(2000));

    const bootloaderLoop = withDeviceInfo.pipe(
      concatMap(
        deviceInfo =>
          !deviceInfo.isBootloader
            ? empty() // we're done
            : concat(
                withDeviceInstall(flash(latestFirmware)),
                wait2s,
                bootloaderLoop,
              ),
      ),
    );

    const osuLoop = withDeviceInfo.pipe(
      concatMap(
        deviceInfo =>
          !deviceInfo.isOSU
            ? empty() // we're done
            : concat(withDeviceInstall(installFinalFirmware), wait2s, osuLoop),
      ),
    );

    this.sub = concat(bootloaderLoop, osuLoop)
      .pipe(filter(e => e.type === "bulk-progress" || e.type === "install"))
      .subscribe({
        next: e => {
          if (e.type === "install") {
            this.setState({ installing: e.step, progress: 0 });
          } else {
            this.setState({ progress: e.progress });
          }
        },
        complete: () => {
          if (navigation.replace) {
            navigation.replace("FirmwareUpdateConfirmation", {
              ...navigation.state.params,
            });
          }
        },
        error: error => {
          if (navigation.replace) {
            navigation.replace("FirmwareUpdateFailure", {
              ...navigation.state.params,
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
    const { installing, progress } = this.state;
    const width = Dimensions.get("window").width;

    return (
      <SafeAreaView style={styles.root}>
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
                <DeviceNanoAction powerAction width={1.2 * width} />
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

export default translate()(FirmwareUpdateMCU);
