// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { translate } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";

import type { T } from "../../types/common";
import colors from "../../colors";
import Rounded from "../Rounded";
import LText from "../LText";

type Props = {
  t: T,
  navigation: *,
};

class ScanningFooter extends PureComponent<Props> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <Rounded bg={colors.pillActiveBackground}>
          <Icon name="bluetooth" color={colors.live} size={28} />
        </Rounded>
        <LText semiBold style={styles.text}>
          {t("SelectDevice.headerDescription")}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingVertical: 30,
    paddingHorizontal: 50,
    flexDirection: "column",
    alignItems: "center",
  },
  text: {
    marginTop: 24,
    color: colors.black,
    fontSize: 14,
    textAlign: "center",
  },
});

export default translate()(ScanningFooter);
