/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";

type Props = {
  navigation: *,
};

class ConfigureDevice extends PureComponent<Props> {
  render() {
    const { navigation } = this.props;
    return (
      <SettingsRow
        title={<Trans i18nKey="settings.configureDevice" />}
        desc={<Trans i18nKey="settings.configureDeviceDesc" />}
        onPress={() => navigation.navigate("PairDevices")}
      />
    );
  }
}

export default ConfigureDevice;
