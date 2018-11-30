/* @flow */
/* eslint-disable no-console */
import React, { Component } from "react";
import { View, Dimensions, StyleSheet } from "react-native";
import { SafeAreaView } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { from, of } from "rxjs";
import { mergeMap, tap } from "rxjs/operators";
import { translate, Trans } from "react-i18next";

import { TrackPage } from "../../analytics";
import { deviceNames } from "../../wording";
import getDeviceInfo from "../../logic/hw/getDeviceInfo";
import installFinalFirmware from "../../logic/hw/installFinalFirmware";
import installOsuFirmware from "../../logic/hw/installOsuFirmware";
import { withDevice } from "../../logic/hw/deviceAccess";
import manager from "../../logic/manager";
import type { Firmware } from "../../types/manager";
import colors from "../../colors";
import StepHeader from "../../components/StepHeader";
import LText from "../../components/LText";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import Installing from "./Installing";

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
};

class FirmwareUpdateCheckId extends Component<Props, State> {
  state = {
    installing: false,
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
          // if in bootloader we'll directly jump to MCU step
          if (deviceInfo.isBootloader) {
            console.log("CheckId: isBootloader");
            return of("FirmwareUpdateMCU");
          }

          // If in OSU we'll try to install firmware and move on to the rest
          if (deviceInfo.isOSU) {
            console.log("CheckId: isOSU");
            this.setState({ installing: true });
            return withDevice(deviceId)(transport =>
              installFinalFirmware(transport),
            ).pipe(
              tap(res => console.log("CheckId: final firmware installed", res)),
              mergeMap(() => of("FirmwareUpdateConfirmation")),
            );
          }

          if (!latestFirmware) {
            return of("FirmwareUpdateConfirmation");
          }

          console.log("CheckId: installOsuFirmware");
          return withDevice(deviceId)(transport =>
            installOsuFirmware(transport, deviceInfo.targetId, latestFirmware),
          ).pipe(
            tap(res => console.log("CheckId: OSU firmware installed", res)),
            mergeMap(() => {
              if (latestFirmware && latestFirmware.shouldFlashMcu) {
                return of("FirmwareUpdateMCU");
              }

              this.setState({ installing: true });
              return withDevice(deviceId)(transport =>
                installFinalFirmware(transport),
              ).pipe(
                tap(res =>
                  console.log("CheckId: final firmware installed (2)", res),
                ),
                mergeMap(() => of("FirmwareUpdateConfirmation")),
              );
            }),
          );
        }),
      )
      .subscribe({
        next: screen => {
          navigation.navigate(screen, {
            ...navigation.state.params,
          });
        },
        error: error => {
          navigation.navigate("FirmwareUpdateFailure", {
            ...navigation.state.params,
            error,
          });
        },
      });
  }

  componentWillUnmount() {
    if (this.sub) this.sub.unsubscribe();
  }

  render() {
    const { installing } = this.state;
    const { navigation } = this.props;
    const latestFirmware = navigation.getParam("latestFirmware");
    const windowWidth = Dimensions.get("window").width;
    return (
      <SafeAreaView style={styles.root}>
        <TrackPage category="FirmwareUpdate" name="CheckId" />
        {installing ? (
          <Installing />
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
