// @flow

import React, { PureComponent } from "react";
import { View, ActivityIndicator, StyleSheet } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../../types/common";
import LText from "../LText";

type Props = {
  t: T,
};

class ScanningFooter extends PureComponent<Props> {
  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <ActivityIndicator />
        <LText style={styles.text} numberOfLines={1}>
          {t("common.scanning.loading")}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
  },
  text: {},
});

export default translate()(ScanningFooter);
