import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import LText from "../../components/LText/index";
import colors from "../../colors";
import getWindowDimensions from "../../logic/getWindowDimensions";

export default class SummaryRowCustom extends PureComponent<{
  onPress: () => void,
  label: string,
  data: *,
  iconLeft: *,
}> {
  render() {
    const { label, data, iconLeft } = this.props;
    return (
      <View style={[styles.root]}>
        <View style={styles.iconLeft}>{iconLeft}</View>
        <View>
          <LText style={styles.labelStyle}>{label}</LText>
          {data}
        </View>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
    paddingVertical: 16,
    // NOTE: temp solution
    width: getWindowDimensions().width - 48,
  },
  labelStyle: {
    fontSize: 16,
    color: colors.grey,
  },
  iconLeft: {
    paddingRight: 16,
  },
});
