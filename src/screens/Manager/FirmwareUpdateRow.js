/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { withNavigation } from "react-navigation";
import LText from "../../components/LText";
import colors from "../../colors";
import type { DeviceInfo, Firmware } from "../../types/manager";
import Button from "../../components/Button";
import manager from "../../logic/manager";

type Props = {
  navigation: *,
  deviceInfo: DeviceInfo,
  deviceId: string,
};

type State = {
  latestFirmware: ?Firmware,
  visibleFirmwareModal: boolean,
  step: string,
};

class FirmwareUpdateRow extends PureComponent<Props, State> {
  state = {
    visibleFirmwareModal: false,
    latestFirmware: null,
    step: "",
  };

  unmount = false;

  async componentDidMount() {
    const { deviceInfo, deviceId, navigation } = this.props;
    const latestFirmware = await manager
      .getLatestFirmwareForDevice(deviceInfo)
      .catch(() => null);

    if (this.unmount) return;
    try {
      if (deviceInfo.isOSU) {
        navigation.navigate("FirmwareUpdateCheckId", {
          deviceId,
          latestFirmware,
        });
      } else if (deviceInfo.isBootloader) {
        navigation.navigate("FirmwareUpdateMCU", {
          deviceId,
          latestFirmware,
        });
      } else {
        this.setState({ latestFirmware });
      }
    } catch (e) {
      console.warn(e);
    }
  }

  componentWillUnmount() {
    this.unmount = true;
  }

  onUpdatePress = () => {
    const { navigation, deviceId } = this.props;
    const { latestFirmware } = this.state;
    navigation.navigate("FirmwareUpdate", {
      deviceId,
      latestFirmware,
    });
  };

  render() {
    const { latestFirmware } = this.state;
    if (!latestFirmware) {
      return null;
    }

    return (
      <View style={styles.root}>
        <LText semiBold numberOfLines={1} style={styles.title}>
          <Trans
            i18nKey="FirmwareUpdateRow.title"
            values={{
              version: manager.getFirmwareVersion(latestFirmware),
            }}
          />
        </LText>
        <Button
          type="primary"
          title={<Trans i18nKey="FirmwareUpdateRow.action" />}
          onPress={this.onUpdatePress}
        />
      </View>
    );
  }
}

export default withNavigation(FirmwareUpdateRow);

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 16,
    alignSelf: "stretch",
    flexDirection: "column",
  },
  title: {
    color: colors.live,
    fontSize: 14,
    padding: 16,
    alignSelf: "center",
  },
  button: {},
});
