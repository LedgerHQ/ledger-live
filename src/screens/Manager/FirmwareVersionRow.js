/* @flow */
import React, { PureComponent } from "react";
import { translate } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import SettingsRow from "../../components/SettingsRow";
import type { T } from "../../types/common";
import LText from "../../components/LText";
import colors from "../../colors";
import type { DeviceInfo } from "../../types/manager";

type Props = {
  t: T,
  navigation: *,
  deviceInfo: DeviceInfo,
};

class FirmwareVersionRow extends PureComponent<Props> {
  render() {
    const { t, deviceInfo } = this.props;
    return (
      <SettingsRow title={t("FirmwareVersionRow.title")} alignedTop>
        <LText semiBold numberOfLines={1} style={styles.version}>
          {deviceInfo.seVersion}
        </LText>
      </SettingsRow>
    );
  }
}

export default translate()(withNavigation(FirmwareVersionRow));

const styles = StyleSheet.create({
  version: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
});
