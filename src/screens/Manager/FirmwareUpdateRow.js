/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet, View } from "react-native";
import { withNavigation } from "react-navigation";
import LText from "../../components/LText";
import colors from "../../colors";
import type {
  DeviceInfo,
  OsuFirmware,
  FinalFirmware,
} from "../../types/manager";
import Button from "../../components/Button";
import manager from "../../logic/manager";

type Props = {
  navigation: *,
  deviceInfo: DeviceInfo,
  deviceId: string,
};

type State = {
  osu: ?OsuFirmware,
  final: ?FinalFirmware,
  visibleFirmwareModal: boolean,
  step: string,
};

class FirmwareUpdateRow extends PureComponent<Props, State> {
  state = {
    visibleFirmwareModal: false,
    osu: null,
    final: null,
    step: "",
  };

  unmount = false;

  async componentDidMount() {
    const { deviceInfo, deviceId, navigation } = this.props;
    const { osu, final } = await manager
      .getLatestFirmwareForDevice(deviceInfo)
      .catch(() => null);

    if (this.unmount) return;
    try {
      if (deviceInfo.isOSU) {
        navigation.navigate("FirmwareUpdateMCU", {
          deviceId,
          osu,
          final,
        });
      } else {
        this.setState({ osu, final });
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
    const { osu, final } = this.state;
    navigation.navigate("FirmwareUpdate", {
      deviceId,
      osu,
      final,
    });
  };

  render() {
    const { osu } = this.state;
    if (!osu) {
      return null;
    }

    return (
      <View style={styles.root}>
        <LText semiBold numberOfLines={1} style={styles.title}>
          <Trans
            i18nKey="FirmwareUpdateRow.title"
            values={{
              version: manager.getFirmwareVersion(osu),
            }}
          />
        </LText>
        <Button
          type="primary"
          event="FirmwareUpdate"
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
