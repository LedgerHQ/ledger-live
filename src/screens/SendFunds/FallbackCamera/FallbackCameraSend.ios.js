/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { Linking } from "react-native";
import type { NavigationScreenProp } from "react-navigation";
import i18next from "i18next";
import type { T } from "../../../types/common";
import FallbackCameraBody from "../../../components/FallbackCameraBody";

class FallBackCameraScreen extends PureComponent<{
  navigation: NavigationScreenProp<*>,
  t: T,
}> {
  static navigationOptions = {
    title: i18next.t("send.scan.fallback.header"),
    headerLeft: null,
  };

  openNativeSettings = () => {
    Linking.openURL("app-settings:");
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

export default translate()(FallBackCameraScreen);
