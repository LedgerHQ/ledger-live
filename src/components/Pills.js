// @flow

import React, { PureComponent, Component } from "react";
import { View, StyleSheet, TouchableOpacity } from "react-native";

import colors from "../colors";

import LText from "./LText";

type Item = {
  key: string,
  label: *,
};

type Props = {
  value: string,
  items: Item[],
  onChange: Item => void,
  isDisabled?: boolean,
};

class Pills extends Component<Props> {
  render() {
    const { items, value, onChange, isDisabled } = this.props;
    return (
      <View style={styles.root}>
        {items.map((item, i) => (
          <Pill
            key={item.key}
            active={value === item.key}
            first={i === 0}
            item={item}
            onPress={onChange}
            isDisabled={isDisabled}
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
  isDisabled?: boolean,
}> {
  render() {
    const { item, first, active, onPress, isDisabled } = this.props;
    const inner = (
      <LText
        style={[
          styles.pillText,
          active && !isDisabled && styles.pillActiveText,
          active && isDisabled && styles.pillActiveDisabledText,
        ]}
        bold
      >
        {item.label}
      </LText>
    );

    if (isDisabled) {
      return (
        <View
          style={[
            styles.pill,
            active && styles.pillActiveDisabled,
            first && styles.pillFirst,
          ]}
        >
          {inner}
        </View>
      );
    }

    return (
      <TouchableOpacity
        style={[
          styles.pill,
          first && styles.pillFirst,
          active && styles.pillActive,
        ]}
        onPress={() => onPress(item)}
      >
        {inner}
      </TouchableOpacity>
    );
  }
}

const styles = StyleSheet.create({
  root: {
    flexDirection: "row",
  },
  pill: {
    borderWidth: 1.5,
    borderColor: colors.fog,
    height: 32,
    marginHorizontal: 5,
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
  pillActiveDisabledText: {
    color: colors.pillActiveDisabledForeground,
  },
  pillFirst: {
    marginLeft: 0,
  },
  pillActive: {
    backgroundColor: colors.pillActiveBackground,
    borderColor: colors.live,
  },
  pillActiveDisabled: {
    backgroundColor: colors.lightGrey,
    borderColor: colors.fog,
  },
});

export default Pills;
