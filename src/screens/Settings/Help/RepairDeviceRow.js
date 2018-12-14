/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import type { NavigationScreenProp } from "react-navigation";
import SettingsRow from "../../../components/SettingsRow";

type Props = {
  navigation: NavigationScreenProp<{}>,
};

class RepairDeviceRow extends PureComponent<Props> {
  onPress = async () => {
    this.props.navigation.navigate("");
  };

  render() {
    return (
      <SettingsRow
        event="RepairDeviceRow"
        title={<Trans i18nKey="settings.help.repairDevice" />}
        desc={<Trans i18nKey="settings.help.repairDeviceDesc" />}
        arrowRight
        onPress={this.onPress}
        alignedTop
      />
    );
  }
}

export default RepairDeviceRow;
