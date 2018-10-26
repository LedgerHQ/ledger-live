// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import { withNavigation } from "react-navigation";
import { translate } from "react-i18next";
import Icon from "react-native-vector-icons/dist/Feather";

import type { T } from "../../types/common";
import colors from "../../colors";
import LText from "../LText";
import Circle from "../Circle";
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
        <Touchable style={styles.inner} onPress={this.onPress}>
          <Circle bg={colors.pillActiveBackground} size={32}>
            <Icon name="plus" color={colors.live} size={20} />
          </Circle>
          <LText semiBold style={styles.text} numberOfLines={1}>
            {t("SelectDevice.deviceNotFoundPairNewDevice")}
          </LText>
        </Touchable>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    paddingHorizontal: 10,
    borderColor: colors.fog,
    borderWidth: 1,
    borderRadius: 4,
    flexDirection: "row",
    alignItems: "center",
    height: 64,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
  },
  text: {
    marginLeft: 12,
    flex: 1,
    color: colors.live,
    fontSize: 16,
  },
});

export default translate()(withNavigation(ScanningFooter));
