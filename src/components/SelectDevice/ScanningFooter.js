// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { translate } from "react-i18next";

import type { T } from "../../types/common";
import LText from "../LText";
import Touchable from "../Touchable";

type Props = {
  t: T,
  navigation: *,
};

class ScanningFooter extends PureComponent<Props> {
  onPress = () => {
    this.props.navigation.navigate("PairDevices");
  };

  render() {
    const { t } = this.props;
    return (
      <View style={styles.root}>
        <Touchable onPress={this.onPress}>
          <LText style={styles.text} numberOfLines={1}>
            {t("SelectDevice.deviceNotFoundPairNewDevice")}
          </LText>
        </Touchable>
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

export default translate()(withNavigation(ScanningFooter));
