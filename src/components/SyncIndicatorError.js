// @flow

import React, { Component } from "react";
import { StyleSheet } from "react-native";
import { translate } from "react-i18next";

import type { T } from "../types/common";
import LText from "./LText";
import Touchable from "./Touchable";

type Props = {
  t: T,
  onPress: () => void,
};

class SyncIndicatorError extends Component<Props> {
  render() {
    const { onPress, t } = this.props;
    return (
      <Touchable onPress={onPress}>
        <LText style={styles.text}>{t("common.sync.error")}</LText>
      </Touchable>
    );
  }
}
const styles = StyleSheet.create({
  text: {
    color: "#f00",
  },
});

export default translate()(SyncIndicatorError);
