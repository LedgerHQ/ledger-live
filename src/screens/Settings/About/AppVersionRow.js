/* @flow */
import React, { PureComponent } from "react";
import VersionNumber from "react-native-version-number";
import { translate } from "react-i18next";
import { View, StyleSheet } from "react-native";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";
import LText from "../../../components/LText";
import colors from "../../../colors";

class AppVersionRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    const { appVersion, buildVersion } = VersionNumber;
    const version = `${appVersion || ""} (${buildVersion || ""})`;
    return (
      <SettingsRow title={t("common:settings.about.appVersion")}>
        <View style={styles.inner}>
          <LText semiBold style={styles.versionText}>
            {version}
          </LText>
        </View>
      </SettingsRow>
    );
  }
}

const styles = StyleSheet.create({
  inner: {
    paddingRight: 10,
  },
  versionText: {
    color: colors.grey,
    fontSize: 14,
  },
});

export default translate()(AppVersionRow);
