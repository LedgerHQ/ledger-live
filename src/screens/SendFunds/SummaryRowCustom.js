import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";
import LText from "../../components/LText/index";

export default class SummaryRowCustom extends PureComponent<{
  onPress: () => void,
  label: string,
  data: *,
  iconLeft: *,
}> {
  render() {
    const { label, data, iconLeft } = this.props;
    return (
      <View style={styles.root}>
        <View style={styles.iconLeft}>{iconLeft}</View>
        <View style={styles.right}>
          <LText style={styles.labelStyle} color="grey">
            {label}
          </LText>
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
  },
  labelStyle: {
    fontSize: 16,
  },
  iconLeft: {
    paddingRight: 16,
  },
  right: {
    flex: 1,
  },
});
