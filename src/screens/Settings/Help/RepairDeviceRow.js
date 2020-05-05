/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { ScreenName } from "../../../const";
import SettingsRow from "../../../components/SettingsRow";

type Props = {
  navigation: any,
};

class RepairDeviceRow extends PureComponent<Props> {
  onPress = async () => {
    this.props.navigation.navigate(ScreenName.RepairDevice);
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
