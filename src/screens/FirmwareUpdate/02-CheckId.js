/* @flow */
/* eslint-disable no-console */
import React, { Component } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { from, of, concat } from "rxjs";
import { mergeMap } from "rxjs/operators";
import { translate, Trans } from "react-i18next";

import { TrackScreen } from "../../analytics";
import { deviceNames } from "../../wording";
import getDeviceInfo from "../../logic/hw/getDeviceInfo";
import installOsuFirmware from "../../logic/hw/installOsuFirmware";
import { withDevice } from "../../logic/hw/deviceAccess";
import manager from "../../logic/manager";
import type { Firmware } from "../../types/manager";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import Installing from "./Installing";

const getDimensions = () => {
  const { width, height } = Dimensions.get("window");
  return { width, height };
};

type Navigation = NavigationScreenProp<{
  params: {
    deviceId: string,
    latestFirmware: ?Firmware,
  },
}>;

type Props = {
  navigation: Navigation,
};

type State = {
  installing: boolean,
  progress: number,
};

class FirmwareUpdateCheckId extends Component<Props, State> {
  state = {
    installing: false,
    progress: 0,
    ...getDimensions(),
  };

  static navigationOptions = {
    headerLeft: null,
    headerTitle: (
      <StepHeader
        subtitle={<Trans i18nKey="FirmwareUpdate.title" />}
        title={<Trans i18nKey="FirmwareUpdateCheckId.title" />}
      />
    ),
  };

  sub: *;

  componentDidMount() {
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    const latestFirmware = navigation.getParam("latestFirmware");

    this.sub = withDevice(deviceId)(transport => from(getDeviceInfo(transport)))
      .pipe(
        mergeMap(deviceInfo => {
          // if in bootloader or OSU we'll directly jump to MCU step
          if (deviceInfo.isBootloader || deviceInfo.isOSU) {
            console.log("CheckId: isBootloader or isOSU");
            return of({ type: "navigate", to: "FirmwareUpdateMCU" });
          }

          // if there is no latest firmware we'll jump to success screen
          if (!latestFirmware) {
            return of({
              type: "navigate",
              to: "FirmwareUpdateConfirmation",
            });
          }

          this.setState({ installing: true });

          console.log("CheckId: installOsuFirmware");

          const $next = of({ type: "navigate", to: "FirmwareUpdateMCU" });

          const $install = withDevice(deviceId)(transport =>
            installOsuFirmware(transport, deviceInfo.targetId, latestFirmware),
          );

          return concat($install, $next);
        }),
      )
      .subscribe({
        next: event => {
          const { type } = event;
          if (type === "navigate") {
            if (navigation.replace) {
              // $FlowFixMe
              navigation.replace(event.to, {
                ...navigation.state.params,
              });
            }
          } else if (type === "bulk-progress") {
            // $FlowFixMe
            this.setState({ progress: event.progress || 0 });
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
    const { navigation } = this.props;
    const latestFirmware = navigation.getParam("latestFirmware");
    const windowWidth = Dimensions.get("window").width;
    return (
      <SafeAreaView style={styles.root}>
        <TrackScreen category="FirmwareUpdate" name="CheckId" />
        {installing ? (
          <Installing progress={progress} installing="osu" />
        ) : (
          <View style={styles.body}>
            <View style={styles.device}>
              <DeviceNanoAction
                powerAction
                action
                screen="validation"
                width={1.2 * windowWidth}
              />
            </View>
            <LText style={styles.description}>
              <Trans
                i18nKey="FirmwareUpdateCheckId.description"
                values={deviceNames.nanoX}
              />
            </LText>
            <View style={[styles.idContainer, { maxWidth: windowWidth - 40 }]}>
              <LText style={styles.id} bold>
                {latestFirmware && manager.formatHashName(latestFirmware.hash)}
              </LText>
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
    alignItems: "center",
  },
  device: {
    left: "25%",
    position: "relative",
  },
  description: {
    color: colors.smoke,
    fontSize: 14,
    marginVertical: 30,
  },
  idContainer: {
    borderRadius: 4,
    borderWidth: 1,
    borderStyle: "dashed",
    borderColor: colors.fog,
    paddingVertical: 10,
    paddingHorizontal: 20,
  },
  id: {
    fontSize: 16,
  },
});

export default translate()(FirmwareUpdateCheckId);
