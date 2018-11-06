/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../components/SettingsRow";
import LText from "../../components/LText";
import colors from "../../colors";
import type { DeviceInfo } from "../../types/manager";

type Props = {
  navigation: *,
  deviceInfo: DeviceInfo,
};

class FirmwareVersionRow extends PureComponent<Props> {
  render() {
    const { deviceInfo } = this.props;
    return (
      <SettingsRow
        title={<Trans i18nKey="FirmwareVersionRow.title" />}
        alignedTop
      >
        <LText semiBold numberOfLines={1} style={styles.version}>
          {deviceInfo.seVersion}
        </LText>
      </SettingsRow>
    );
  }
}

export default withNavigation(FirmwareVersionRow);

const styles = StyleSheet.create({
  version: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
});
