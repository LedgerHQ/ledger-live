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
        <Bullet>{index + 1}</Bullet>
        <View style={styles.textContainer}>
          <LText style={styles.text}>{value}</LText>
        </View>
      </View>
    );

    return <View>{list.map(renderItem)}</View>;
  }
}

export class Bullet extends PureComponent<{ children: *, big?: boolean }> {
  render() {
    const { children, big } = this.props;
    return (
      <View style={[styles.bulletContainer, big && styles.bulletContainerBig]}>
        <LText style={[styles.number, big && styles.numberBig]} tertiary>
          {children}
        </LText>
      </View>
    );
  }
}

const styles = StyleSheet.create({
  item: {
    paddingVertical: 8,
    flexDirection: "row",
    alignItems: "center",
  },
  textContainer: { flexShrink: 1, flexGrow: 1 },
  bulletContainer: {
    width: 24,
    height: 24,
    backgroundColor: "#eff3fd",
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
  },
  bulletContainerBig: {
    width: 32,
    height: 32,
    borderRadius: 16,
  },
  number: {
    fontSize: 12,
    color: colors.live,
  },
  numberBig: {
    fontSize: 16,
  },
  text: {
    color: colors.smoke,
    fontSize: 14,
    paddingLeft: 16,
  },
});

export default BulletList;
