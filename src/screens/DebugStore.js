// @flow

import React, { PureComponent } from "react";
import { Text, StyleSheet, View } from "react-native";
import { useSelector } from "react-redux";
import NavigationScrollView from "../components/NavigationScrollView";

import colors from "../colors";

class CollapsibleThingy extends PureComponent<
  { obj: Object, depth: number },
  { shown: {} },
> {
  state = {
    shown: {},
  };

  toggleCollapse = key =>
    this.setState(prevState => ({
      shown: { ...prevState.shown, [key]: !prevState.shown[key] },
    }));

  render() {
    const { obj, depth = 0 } = this.props;
    const { shown } = this.state;

    return (
      <View>
        {Object.keys(obj || {}).map(key => {
          const rowKey = depth + key;
          const value = obj[key];
          const isObject = typeof value === "object";
          const isOpen = shown[rowKey];
          const bullet = isObject ? (isOpen ? "-" : "+") : "";

          return (
            <View key={rowKey} style={styles.wrapper}>
              <Text
                style={styles.header}
                onPress={
                  isObject ? () => this.toggleCollapse(rowKey) : undefined
                }
              >
                {bullet} {key}
              </Text>
              {isObject ? (
                isOpen && <CollapsibleThingy obj={value} depth={depth + 1} />
              ) : (
                <Text
                  selectable
                  style={styles.value}
                >{`(${typeof value}) ${value}`}</Text>
              )}
            </View>
          );
        })}
      </View>
    );
  }
}

export default function DebugStore() {
  const state = useSelector(s => s);

  return (
    <NavigationScrollView>
      <CollapsibleThingy obj={state} depth={1} />
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  root: {
    padding: 16,
    backgroundColor: colors.white,
  },
  wrapper: {
    borderLeftWidth: 1,
    borderColor: colors.fog,
    paddingLeft: 8,
    backgroundColor: colors.white,
  },
  buttonStyle: {
    marginBottom: 16,
  },
  header: {
    fontSize: 18,
    borderRadius: 8,
    marginVertical: 4,
    paddingHorizontal: 4,
    paddingVertical: 2,
    color: colors.darkBlue,
    backgroundColor: colors.white,
    flex: 1,
  },
  value: {
    color: colors.smoke,
    backgroundColor: colors.white,
    paddingHorizontal: 4,
    paddingVertical: 2,
    paddingLeft: 8,
    fontSize: 14,
  },
});
