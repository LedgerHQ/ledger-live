import React, { PureComponent } from "react";
import { TFunction, withTranslation } from "react-i18next";
import { AppState, Linking } from "react-native";
import { ScreenName } from "../../const";
import FallbackCameraBody from "../../components/FallbackCameraBody";
import type { NavigationProps } from "./FallBackCameraScreen";

type Props = {
  t: TFunction;
} & NavigationProps;

type State = {
  appState: string;
  openSettingsPressed: boolean;
};

class FallBackCameraScreen extends PureComponent<Props, State> {
  listener: ReturnType<typeof AppState.addEventListener> | undefined;
  state = {
    appState: AppState.currentState,
    openSettingsPressed: false,
  };

  componentDidMount() {
    this.listener = AppState.addEventListener(
      "change",
      this.handleAppStateChange,
    );
  }

  componentWillUnmount() {
    this.listener?.remove();
  }

  handleAppStateChange = (nextAppState: string) => {
    const { appState, openSettingsPressed } = this.state;
    const { navigation } = this.props;

    if (
      appState.match(/inactive|background/) &&
      nextAppState === "active" &&
      openSettingsPressed
    ) {
      navigation.replace(ScreenName.ScanAccounts, {});
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
        title={t("account.import.fallback.title")}
        description={t("account.import.fallback.desc")}
        buttonTitle={t("account.import.fallback.buttonTitle")}
        onPress={this.openNativeSettings}
      />
    );
  }
}

export default withTranslation()(FallBackCameraScreen);
