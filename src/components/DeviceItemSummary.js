// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { connect } from "react-redux";
import { translate } from "react-i18next";
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
  t: *,
};

class DeviceItemSummary extends PureComponent<Props> {
  render() {
    const { name, genuine, onEdit, t } = this.props;
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
                {t("DeviceItemSummary.genuine")}
                {"  "}
              </LText>
              <Circle bg={colors.live} size={16}>
                <Icon name="check" size={10} color={colors.white} />
              </Circle>
            </View>
          ) : null}
        </View>
        <Touchable onPress={onEdit}>
          <LText numberOfLines={1} style={styles.editText}>
            Edit
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
)(translate()(DeviceItemSummary));

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
    fontSize: 14,
    color: colors.darkBlue,
  },
  genuine: {
    flexDirection: "row",
  },
  genuineText: {
    fontSize: 12,
    color: colors.grey,
  },
  editText: {
    color: colors.live,
    textDecorationLine: "underline",
  },
});
