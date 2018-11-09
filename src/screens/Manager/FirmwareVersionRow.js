/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import LText from "../../components/LText";
import colors from "../../colors";
import type { DeviceInfo } from "../../types/manager";
import Row from "./Row";

type Props = {
  navigation: *,
  deviceInfo: DeviceInfo,
};

class FirmwareVersionRow extends PureComponent<Props> {
  render() {
    const { deviceInfo } = this.props;
    return (
      <Row
        title={<Trans i18nKey="FirmwareVersionRow.title" />}
        alignedTop
        compact
        bottom
      >
        <LText semiBold numberOfLines={1} style={styles.version}>
          {deviceInfo.seVersion}
        </LText>
      </Row>
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
