/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";

type Props = {
  t: T,
  navigation: *,
};

class ConfigureDevice extends PureComponent<Props> {
  render() {
    const { t, navigation } = this.props;
    return (
      <SettingsRow
        title={t("settings.configureDevice")}
        desc={t("settings.configureDeviceDesc")}
        onPress={() => navigation.navigate("PairDevices")}
      />
    );
  }
}

export default translate()(ConfigureDevice);
