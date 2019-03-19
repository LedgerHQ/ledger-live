// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { Trans } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";
import { getDeviceModel } from "@ledgerhq/devices";

import colors from "../../colors";
import Rounded from "../Rounded";
import LText from "../LText";

type Props = {
  navigation: *,
};

class ScanningFooter extends PureComponent<Props> {
  render() {
    return (
      <View style={styles.root}>
        <Rounded bg={colors.pillActiveBackground}>
          <Icon name="bluetooth" color={colors.live} size={28} />
        </Rounded>
        <LText style={styles.text}>
          <Trans
            i18nKey="SelectDevice.headerDescription"
            values={getDeviceModel("nanoX")}
          />
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingTop: 24,
    paddingBottom: 32,
    flexDirection: "column",
    alignItems: "center",
  },
  text: {
    marginTop: 24,
    color: colors.smoke,
    fontSize: 14,
    lineHeight: 21,
    textAlign: "center",
  },
});

export default ScanningFooter;
