/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import SettingsRow from "../../../components/SettingsRow";
import type { T } from "../../../types/common";

class ConfigureDeviceRow extends PureComponent<{
  t: T,
}> {
  render() {
    const { t } = this.props;
    return (
      <SettingsRow
        title={t("settings.help.configureDevice")}
        desc={t("settings.help.configureDeviceDesc")}
        onPress={null}
      />
    );
  }
}

export default translate()(ConfigureDeviceRow);
