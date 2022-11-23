import React, { PureComponent } from "react";
import { AppState, Linking } from "react-native";
import { Trans } from "react-i18next";
import SettingsIcon from "../../icons/SettingsIcon";
import Button from "../Button";

export default class AppPermissionsButton extends PureComponent<
  {
    onRetry: () => void;
  },
  {
    appState: string | null | undefined;
    buttonPressed: boolean;
  }
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

  handleAppStateChange = (nextAppState: string | null | undefined) => {
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
      this.setState({
        appState: nextAppState,
      });
    }
  };
  openAppSettings = () => {
    this.setState({
      buttonPressed: true,
    });
    Linking.openSettings();
  };

  render() {
    return (
      <Button
        event="LocationPermissionOpenSettings"
        type="primary"
        title={<Trans i18nKey="permissions.open" />}
        onPress={this.openAppSettings}
        IconLeft={SettingsIcon}
      />
    );
  }
}
