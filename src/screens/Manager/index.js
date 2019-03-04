/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Image, Platform } from "react-native";
import { withNavigationFocus } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { connect } from "react-redux";
import { Trans, translate } from "react-i18next";
import i18next from "i18next";
import { compose } from "redux";
import manager from "@ledgerhq/live-common/lib/manager";
import Icon from "react-native-vector-icons/dist/Feather";
import {
  connectingStep,
  dashboard,
  genuineCheck,
  getDeviceName,
} from "../../components/DeviceJob/steps";
import SelectDevice from "../../components/SelectDevice";
import RemoveDeviceButton from "../../components/SelectDevice/RemoveDeviceButton";
import colors from "../../colors";
import TrackScreen from "../../analytics/TrackScreen";
import { track } from "../../analytics";
import LText from "../../components/LText";
import Circle from "../../components/Circle";
import Touchable from "../../components/Touchable";
import { knownDevicesSelector } from "../../reducers/ble";
import type { DeviceLike } from "../../reducers/ble";
import SectionSeparator from "../../components/SectionSeparator";
import USBEmpty from "../../components/SelectDevice/USBEmpty";
import BluetoothEmpty from "../../components/SelectDevice/BluetoothEmpty";

const IconPlus = () => (
  <Circle bg={colors.live} size={14}>
    <Icon name="plus" size={10} color={colors.white} />
  </Circle>
);

const mapStateToProps = state => ({
  knownDevices: knownDevicesSelector(state),
});

class ChooseDevice extends Component<
  {
    navigation: NavigationScreenProp<*>,
    isFocused: boolean,
    readOnlyModeEnabled: boolean,
    knownDevices: DeviceLike[],
  },
  {
    toForget: string[],
  },
> {
  static navigationOptions = ({ navigation }) => {
    const { params } = navigation.state;
    let key = "manager.title";

    if (params) {
      if (params.title) {
        key = params.title;
      }
    }
    const title = i18next.t(key);
    return {
      title,
      headerRight: null,
    };
  };

  static getDerivedStateFromProps({ navigation }, { toForget }) {
    if (toForget.length > 0 && !navigation.getParam("editMode")) {
      return {
        toForget: [],
      };
    }
    return null;
  }

  state = {
    toForget: [],
  };

  onPairNewDevice = () => {
    const { navigation } = this.props;
    navigation.navigate("PairDevices");
  };

  onForgetSelect = (id: string) => {
    this.setState(state => {
      const toForget = state.toForget.includes(id)
        ? state.toForget.filter(d => d !== id)
        : [...state.toForget, id];
      return { toForget };
    });
  };

  onResetToForget = () => {
    this.setState({ toForget: [] });
  };

  onSelect = (deviceId: string, meta: Object) => {
    const { fullVersion, seVersion, mcuVersion } = meta.deviceInfo;
    track("ManagerDeviceEntered", {
      fullVersion,
      seVersion,
      mcuVersion,
    });
    this.props.navigation.navigate("ManagerMain", {
      deviceId,
      meta,
    });
  };

  onStepEntered = (i: number, meta: Object) => {
    if (i === 2) {
      Promise.all([
        // Step dashboard, we preload the applist before entering manager while we're still doing the genuine check
        manager
          .getAppsList(meta.deviceInfo)
          .then(apps =>
            Promise.all(
              apps.map(app => Image.prefetch(manager.getIconUrl(app.icon))),
            ),
          ),
        // we also preload as much info as possible in case of a MCU
        manager.getLatestFirmwareForDevice(meta.deviceInfo),
      ]).catch(e => {
        console.warn(e);
      });
    }
  };

  componentDidMount() {
    const { readOnlyModeEnabled } = this.props;

    if (readOnlyModeEnabled) {
      this.props.navigation.setParams({
        title: "manager.readOnly.title",
        headerRight: null,
      });
    }
  }

  render() {
    const { isFocused, knownDevices } = this.props;
    const hasDevices = knownDevices.length > 0;

    if (!isFocused) return null;

    const editMode = this.props.navigation.getParam("editMode");
    return (
      <View style={styles.root}>
        <TrackScreen category="Manager" name="ChooseDevice" />
        <LText semiBold style={styles.title}>
          <Trans i18nKey="manager.connect" />
        </LText>

        {hasDevices && (
          <Touchable
            event="PairNewDevice"
            style={styles.bluetoothHeader}
            onPress={this.onPairNewDevice}
          >
            <LText semiBold style={styles.section}>
              <Trans i18nKey="common.bluetooth" />
            </LText>
            <View style={styles.addContainer}>
              <LText semiBold style={styles.add}>
                <Trans i18nKey="common.add" />
              </LText>
              <IconPlus />
            </View>
          </Touchable>
        )}
        <SelectDevice
          showDiscoveredDevices={false}
          onSelect={this.onSelect}
          editMode={editMode}
          steps={[connectingStep, dashboard, genuineCheck, getDeviceName]}
          onStepEntered={this.onStepEntered}
          onForgetSelect={this.onForgetSelect}
          selectedIds={this.state.toForget}
          ListEmptyComponent={BluetoothEmpty}
        />
        <RemoveDeviceButton
          show={editMode}
          deviceIds={this.state.toForget}
          reset={this.onResetToForget}
        />

        {Platform.OS === "android" && (
          <>
            {hasDevices ? (
              <LText semiBold style={styles.section}>
                <Trans i18nKey="common.usb" />
              </LText>
            ) : (
              <SectionSeparator style={styles.or} text="OR" />
            )}

            <SelectDevice
              showKnownDevices={false}
              onSelect={this.onSelect}
              editMode={editMode}
              steps={[connectingStep, dashboard, genuineCheck, getDeviceName]}
              onStepEntered={this.onStepEntered}
              onForgetSelect={this.onForgetSelect}
              selectedIds={this.state.toForget}
              ListEmptyComponent={USBEmpty}
            />
          </>
        )}
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
    paddingHorizontal: 16,
  },
  or: {
    marginVertical: 30,
  },
  title: {
    lineHeight: 27,
    fontSize: 18,
    marginVertical: 24,
    color: colors.darkBlue,
  },
  section: {
    fontSize: 14,
    lineHeight: 21,
    marginBottom: 12,
    color: colors.grey,
  },
  addContainer: {
    flexDirection: "row",
    alignItems: "center",
  },
  add: {
    marginRight: 8,
    color: colors.live,
  },
  bluetoothHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "flex-start",
  },
});

export default compose(
  translate(),
  connect(mapStateToProps),
)(withNavigationFocus(ChooseDevice));
