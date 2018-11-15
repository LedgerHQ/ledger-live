/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { Linking } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import i18next from "i18next";
import type { T } from "../../types/common";
import FallbackCameraBody from "../../components/FallbackCameraBody";

class FallBackCameraScreen extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  static navigationOptions = {
    title: i18next.t("account.import.fallback.header"),
  };

  openNativeSettings = () => {
    Linking.openURL("app-settings:");
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

export default translate()(FallBackCameraScreen);
