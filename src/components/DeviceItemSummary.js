// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { Trans } from "react-i18next";
import { createStructuredSelector } from "reselect";
import Icon from "react-native-vector-icons/dist/Feather";
import { deviceNameByDeviceIdSelector } from "../reducers/ble";
import Circle from "./Circle";
import Touchable from "./Touchable";
import LText from "./LText";
import colors from "../colors";
import IconNanoX from "../icons/NanoX";

type Props = {
  deviceId: string,
  name: string,
  genuine: boolean,
  onEdit: () => *,
};

class DeviceItemSummary extends PureComponent<Props> {
  render() {
    const { name, genuine, onEdit } = this.props;
    return (
      <View style={styles.root}>
        <IconNanoX color={colors.darkBlue} height={36} width={8} />
        <View style={styles.content}>
          <LText bold numberOfLines={1} style={styles.deviceNameText}>
            {name}
          </LText>
          {genuine ? (
            <View style={styles.genuine}>
              <LText numberOfLines={1} style={styles.genuineText}>
                <Trans i18nKey="DeviceItemSummary.genuine" />
                {"  "}
              </LText>
              <Circle bg={colors.live} size={20}>
                <Icon name="check" size={14} color={colors.white} />
              </Circle>
            </View>
          ) : null}
        </View>
        <Touchable event="DeviceItemEdit" onPress={onEdit}>
          <LText bold numberOfLines={1} style={styles.editText}>
            <Trans i18nKey="common.rename" />
          </LText>
        </Touchable>
      </View>
    );
  }
}

export default connect(
  createStructuredSelector({
    name: deviceNameByDeviceIdSelector,
  }),
)(DeviceItemSummary);

const styles = StyleSheet.create({
  outer: {
    marginBottom: 16,
  },
  root: {
    paddingVertical: 14,
    paddingHorizontal: 24,
    borderColor: colors.fog,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    overflow: "hidden",
  },
  content: {
    flexDirection: "column",
    justifyContent: "center",
    flexGrow: 1,
    marginLeft: 24,
  },
  deviceNameText: {
    fontSize: 16,
    color: colors.darkBlue,
  },
  genuine: {
    paddingTop: 4,
    flexDirection: "row",
    alignItems: "center",
  },
  genuineText: {
    fontSize: 14,
    color: colors.smoke,
  },
  editText: {
    color: colors.live,
  },
});
