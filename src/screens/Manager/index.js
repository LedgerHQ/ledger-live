/* @flow */
import React, { Component } from "react";
import { View, StyleSheet, Image } from "react-native";
import { withNavigationFocus } from "react-navigation";
import type { NavigationScreenProp } from "react-navigation";
import { translate } from "react-i18next";
import {
  connectingStep,
  dashboard,
  genuineCheck,
} from "../../components/DeviceJob/steps";
import SelectDevice from "../../components/SelectDevice";
import RemoveDeviceButton from "../../components/SelectDevice/RemoveDeviceButton";
import colors from "../../colors";
import ToggleManagerEdition from "./ToggleManagerEdition";
import manager from "../../logic/manager";
import TrackScreen from "../../analytics/TrackScreen";
import { track } from "../../analytics";

class Manager extends Component<
  {
    navigation: NavigationScreenProp<*>,
    isFocused: boolean,
  },
  {
    toForget: string[],
  },
> {
  static navigationOptions = {
    title: "Manager",
    headerRight: <ToggleManagerEdition />,
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

  render() {
    const { isFocused } = this.props;
    if (!isFocused) return null;
    const editMode = this.props.navigation.getParam("editMode");
    return (
      <View style={styles.root}>
        <TrackScreen category="Manager" name="SelectDevice" />
        <SelectDevice
          onSelect={this.onSelect}
          editMode={editMode}
          steps={[connectingStep, dashboard, genuineCheck]}
          onStepEntered={this.onStepEntered}
          onForgetSelect={this.onForgetSelect}
          selectedIds={this.state.toForget}
        />
        <RemoveDeviceButton
          show={editMode}
          deviceIds={this.state.toForget}
          reset={this.onResetToForget}
        />
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: colors.white,
  },
});

export default translate()(withNavigationFocus(Manager));
