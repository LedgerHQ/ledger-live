import React, { PureComponent } from "react";
import { View, StyleSheet, Dimensions } from "react-native";
import LText from "../../components/LText/index";
import colors from "../../colors";

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
    paddingHorizontal: 16,
    paddingVertical: 16,
    // NOTE: temp solution
    width: Dimensions.get("window").width - 48,
  },
  labelStyle: {
    fontSize: 16,
    color: colors.grey,
  },
  iconLeft: {
    paddingRight: 16,
  },
});
