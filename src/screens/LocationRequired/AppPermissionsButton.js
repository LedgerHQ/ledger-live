// @flow

import React, { PureComponent } from "react";
import { AppState } from "react-native";
import OpenSettings from "react-native-open-settings";
import SettingsIcon from "./assets/SettingsIcon";
import Button from "../../components/Button";

export default class AppPermissionsButton extends PureComponent<
  {
    onRetry: Function,
  },
  {
    appState: ?string,
    buttonPressed: boolean,
  },
> {
  state = {
    appState: AppState.currentState,
    buttonPressed: false,
  };

  componentDidMount() {
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: ?string) => {
    const { appState, buttonPressed } = this.state;
    const { onRetry } = this.props;
    if (
      appState &&
      appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      buttonPressed
    ) {
      onRetry();
    } else {
      this.setState({ appState: nextAppState });
    }
  };

  openAppSettings = () => {
    this.setState({ buttonPressed: true });
    OpenSettings.openSettings();
  };

  render() {
    return (
      <Button
        type="primary"
        title="Open app permissions"
        onPress={this.openAppSettings}
        iconLeft={SettingsIcon}
      />
    );
  }
}
