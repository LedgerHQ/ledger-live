// @flow

import React, { PureComponent, Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

import colors from "../colors";

import LText from "../components/LText";

type Item = {
  key: string,
  label: string,
};

type Props = {
  value: string,
  items: Item[],
  onChange: Item => void,
};

class Pills extends Component<Props> {
  render() {
    const { items, value, onChange } = this.props;
    return (
      <View style={styles.root}>
        {items.map((item, i) => (
          <Pill
            key={item.key}
            active={value === item.key}
            first={i === 0}
            item={item}
            onPress={onChange}
          />
        ))}
      </View>
    );
  }
}

class Pill extends PureComponent<{
  item: Item,
  first: boolean,
  active: boolean,
  onPress: Item => void,
}> {
  render() {
    const { item, first, active, onPress } = this.props;
    return (
      <TouchableOpacity
        style={[
          styles.pill,
          first && styles.pillFirst,
          active && styles.pillActive,
        ]}
        onPress={() => onPress(item)}
      >
        <LText
          style={[styles.pillText, active && styles.pillActiveText]}
          semiBold={active}
        >
          {item.label}
        </LText>
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
  },
  pill: {
    height: 32,
    paddingHorizontal: 15,
    borderRadius: 4,
    justifyContent: "center",
  },
  pillText: {
    color: colors.pillForeground,
  },
  pillActiveText: {
    color: colors.pillActiveForeground,
  },
  pillFirst: {
    marginLeft: 0,
  },
  pillActive: {
    backgroundColor: colors.pillActiveBackground,
  },
});

export default Pills;
