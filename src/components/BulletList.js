// @flow

import React, { PureComponent } from "react";
import { View, StyleSheet } from "react-native";

import LText from "./LText";
import colors from "../colors";

class BulletList extends PureComponent<{
  list: *,
}> {
  render() {
    const { list } = this.props;

    const renderItem = (value, index) => (
      <View key={index} style={styles.item}>
        <View style={styles.bulletContainer}>
          <LText style={styles.number} tertiary>
            {index + 1}
          </LText>
        </View>
        <LText style={styles.text}>{value}</LText>
      </View>
    );

    return <View>{list.map(renderItem)}</View>;
  }
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  bulletContainer: {
    width: 24,
    height: 24,
    backgroundColor: "#eff3fd",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  number: {
    fontSize: 12,
    color: colors.live,
  },
  text: {
    color: colors.smoke,
    fontSize: 14,
    paddingLeft: 16,
  },
});

export default BulletList;
