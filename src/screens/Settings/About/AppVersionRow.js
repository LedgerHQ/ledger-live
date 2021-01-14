/* @flow */
import React, { PureComponent } from "react";
import VersionNumber from "react-native-version-number";
import { Trans } from "react-i18next";
import { View, StyleSheet } from "react-native";
import cleanBuildVersion from "../../../logic/cleanBuildVersion";
import SettingsRow from "../../../components/SettingsRow";
import LText from "../../../components/LText";

class AppVersionRow extends PureComponent<*> {
  render() {
    const { appVersion, buildVersion } = VersionNumber;
    const version = `${appVersion || ""} (${cleanBuildVersion(buildVersion) ||
      ""})`;
    return (
      <SettingsRow
        event="AppVersionRow"
        title={<Trans i18nKey="settings.about.appVersion" />}
      >
        <View style={styles.inner}>
          <LText semiBold style={styles.versionText} color="grey">
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
    fontSize: 14,
  },
});

export default AppVersionRow;
