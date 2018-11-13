/* @flow */
import React, { Component } from "react";
import invariant from "invariant";
import { View, Dimensions, SafeAreaView, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { from } from "rxjs";
import { translate, Trans } from "react-i18next";

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
    headerTitle: (
      <StepHeader
        subtitle={<Trans i18nKey="FirmwareUpdate.title" />}
        title={<Trans i18nKey="FirmwareUpdateCheckId.title" />}
      />
    ),
  };

  async componentDidMount() {
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");
    const latestFirmware = navigation.getParam("latestFirmware");

    // TODO IMPORTANT move this whole logic to RXJS
    try {
      const deviceInfo = await withDevice(deviceId)(transport =>
        from(getDeviceInfo(transport)),
      ).toPromise();

      if (deviceInfo.isBootloader) {
        navigation.navigate("FirmwareUpdateMCU", {
          ...navigation.state.params,
        });
      } else if (deviceInfo.isOSU) {
        this.setState({ installing: true });
        await withDevice(deviceId)(transport =>
          from(installFinalFirmware(transport)),
        ).toPromise();

        navigation.navigate("FirmwareUpdateConfirmation", {
          ...navigation.state.params,
        });
      } else {
        invariant(latestFirmware, "latestFirmware missing");

        await withDevice(deviceId)(transport =>
          from(
            installOsuFirmware(transport, deviceInfo.targetId, latestFirmware),
          ),
        ).toPromise();

        this.setState({ installing: true });

        if (latestFirmware && latestFirmware.shouldFlashMcu) {
          navigation.navigate("FirmwareUpdateMCU", {
            ...navigation.state.params,
          });
        } else {
          await withDevice(deviceId)(transport =>
            from(installFinalFirmware(transport)),
          ).toPromise();
          navigation.navigate("FirmwareUpdateConfirmation", {
            ...navigation.state.params,
          });
        }
      }
    } catch (error) {
      navigation.navigate("FirmwareUpdateFailure", {
        ...navigation.state.params,
        error,
      });
    }
  }

  render() {
    const { installing } = this.state;
    const { navigation } = this.props;
    const latestFirmware = navigation.getParam("latestFirmware");
    const windowWidth = Dimensions.get("window").width;
    return (
      <SafeAreaView style={styles.root}>
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
