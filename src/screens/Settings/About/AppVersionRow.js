/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { View } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import LText from "../../../components/LText";

class AppVersionRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    // TODO wire up app version with env var
    return (
      <SettingsRow
        title={t("common:settings.about.appVersion")}
        desc={null}
        onPress={null}
      >
        <View style={{ margin: 10 }}>
          <LText>v1.1.3</LText>
        </View>
      </SettingsRow>
    );
  }
}

export default translate()(AppVersionRow);
