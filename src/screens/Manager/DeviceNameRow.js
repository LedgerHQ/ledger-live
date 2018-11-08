/* @flow */
import React, { PureComponent } from "react";
import { Trans } from "react-i18next";
import { StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { connect } from "react-redux";
import { createStructuredSelector } from "reselect";
import { deviceNameByDeviceIdSelector } from "../../reducers/ble";
import LText from "../../components/LText";
import colors from "../../colors";
import Row from "./Row";

type Props = {
  navigation: *,
  deviceId: string,
  name: string,
};

class DeviceNameRow extends PureComponent<Props> {
  onPress = () => {
    const { navigation, deviceId } = this.props;
    navigation.navigate("EditDeviceName", {
      deviceId,
    });
  };

  render() {
    const { name } = this.props;
    return (
      <Row
        title={<Trans i18nKey="DeviceNameRow.title" />}
        arrowRight
        alignedTop
        onPress={this.onPress}
        compact
        top
      >
        <LText
          semiBold
          numberOfLines={1}
          ellipsizeMode="tail"
          style={styles.accountName}
        >
          {name}
        </LText>
      </Row>
    );
  }
}

export default connect(
  createStructuredSelector({ name: deviceNameByDeviceIdSelector }),
)(withNavigation(DeviceNameRow));

const styles = StyleSheet.create({
  accountName: {
    flexShrink: 1,
    textAlign: "right",
    color: colors.grey,
  },
});
