import React, { PureComponent } from "react";
import { withTranslation } from "react-i18next";
import { AppState, AppStateStatus, Linking } from "react-native";
import FallbackCameraBody from "../FallbackCameraBody";
import type { Props } from "./FallbackCameraSend";

type State = {
  appState: string;
  openSettingsPressed: boolean;
};

class FallBackCameraScreen extends PureComponent<Props, State> {
  state = {
    appState: AppState.currentState,
    openSettingsPressed: false,
  };

  componentDidMount() {
    AppState.addEventListener("change", this.handleAppStateChange);
  }

  componentWillUnmount() {
    AppState.removeEventListener("change", this.handleAppStateChange);
  }

  handleAppStateChange = (nextAppState: AppStateStatus) => {
    const { appState, openSettingsPressed } = this.state;
    const { navigation, route } = this.props;

    if (
      appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      openSettingsPressed &&
      route.params.screenName
    ) {
      navigation.replace(route.params.screenName);
    }

    this.setState({
      appState: nextAppState,
    });
  };
  openNativeSettings = () => {
    this.setState({
      openSettingsPressed: true,
    });
    Linking.openSettings();
  };

  render() {
    const { t } = this.props;
    return (
      <FallbackCameraBody
        title={t("send.scan.fallback.title")}
        description={t("send.scan.fallback.desc")}
        buttonTitle={t("send.scan.fallback.buttonTitle")}
        onPress={this.openNativeSettings}
      />
    );
  }
}

export default withTranslation()(FallBackCameraScreen);
