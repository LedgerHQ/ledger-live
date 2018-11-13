/* @flow */
import React, { Component } from "react";
import { View, SafeAreaView, Dimensions, StyleSheet } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import { from } from "rxjs";
import { translate, Trans } from "react-i18next";
import installMcu from "../../logic/hw/installMcu";
import installFinalFirmware from "../../logic/hw/installFinalFirmware";
import getDeviceInfo from "../../logic/hw/getDeviceInfo";
import { withDevice, withDevicePolling } from "../../logic/hw/deviceAccess";
import type { Firmware } from "../../types/manager";
import colors from "../../colors";
import DeviceNanoAction from "../../components/DeviceNanoAction";
import StepHeader from "../../components/StepHeader";
import { BulletItem } from "../../components/BulletList";
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

class FirmwareUpdateMCU extends Component<Props, State> {
  static navigationOptions = {
    headerTitle: (
      <StepHeader
        subtitle={<Trans i18nKey="FirmwareUpdate.title" />}
        title={<Trans i18nKey="FirmwareUpdateMCU.title" />}
      />
    ),
  };

  state = {
    installing: false,
  };

  async componentDidMount() {
    const { navigation } = this.props;
    const deviceId = navigation.getParam("deviceId");

    // TODO IMPORTANT move this whole logic to RXJS
    try {
      let deviceInfo = await withDevice(deviceId)(transport =>
        from(getDeviceInfo(transport)),
      ).toPromise();

      if (deviceInfo.isBootloader) {
        this.setState({ installing: true });
        await withDevice(deviceId)(transport =>
          from(installMcu(transport)),
        ).toPromise();
      }

      deviceInfo = await withDevicePolling(deviceId)(transport =>
        from(getDeviceInfo(transport)),
      ).toPromise();

      if (deviceInfo.isOSU) {
        await withDevice(deviceId)(transport =>
          from(installFinalFirmware(transport)),
        );
      }

      navigation.navigate("FirmwareUpdateConfirmation", {
        ...navigation.state.params,
      });
    } catch (error) {
      navigation.navigate("FirmwareUpdateFailure", {
        ...navigation.state.params,
        error,
      });
    }
  }

  render() {
    const { installing } = this.state;
    const windowWidth = Dimensions.get("window").width;
    return (
      <SafeAreaView style={styles.root}>
        {installing ? (
          <Installing />
        ) : (
          <View style={styles.body}>
            <View style={styles.step}>
              <BulletItem
                index={0}
                value={<Trans i18nKey="FirmwareUpdateMCU.desc1" />}
              />
              <View style={styles.device}>
                <DeviceNanoAction width={1.2 * windowWidth} />
              </View>
            </View>

            <View style={styles.step}>
              <BulletItem
                index={1}
                value={<Trans i18nKey="FirmwareUpdateMCU.desc2" />}
              />
              <View style={styles.device}>
                <DeviceNanoAction powerAction width={1.2 * windowWidth} />
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
