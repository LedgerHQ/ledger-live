// @flow

import React, { useCallback, PureComponent } from "react";
import { BigNumber } from "bignumber.js";
import { Text, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import NavigationScrollView from "../components/NavigationScrollView";
import Button from "../components/Button";

class CollapsibleThingy extends PureComponent<
  { obj: Object, depth: number, colors: * },
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
    const { obj, depth = 0, colors } = this.props;
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
            <View
              key={rowKey}
              style={[
                styles.wrapper,
                { backgroundColor: colors.white, borderColor: colors.fog },
              ]}
            >
              <Text
                style={[styles.header, { backgroundColor: colors.white }]}
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
                  style={[
                    styles.value,
                    { color: colors.smoke, backgroundColor: colors.white },
                  ]}
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
  const { colors } = useTheme();

  const dispatch = useDispatch();

  /**
    With remote debugging enabled, trigger this callback
    if you want to override the state, make your changes to the `appState` object
    set the `override` flag to true, and resume execution.
    The store will now have your changes
  */
  const onStoreDebug = useCallback(() => {
    window.BigNumber = BigNumber; // NB expose BigNumber to be able to modify the state easier
    // eslint-disable-next-line prefer-const
    let override = false;
    const appState = state;
    // eslint-disable-next-line no-console
    console.log({ state });
    // eslint-disable-next-line no-debugger
    debugger;
    if (__DEV__ && override) {
      dispatch({ action: "DANGEROUSLY_OVERRIDE_STATE", payload: appState });
    }
  }, [dispatch, state]);

  return (
    <NavigationScrollView>
      <View style={{ padding: 16, backgroundColor: "white", flex: 1 }}>
        <Button
          event="DebugState"
          type="primary"
          title={"See on browser (debug on)"}
          containerStyle={{ marginBottom: 16 }}
          onPress={onStoreDebug}
        />
        <CollapsibleThingy obj={state} depth={1} colors={colors} />
      </View>
    </NavigationScrollView>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderLeftWidth: 1,
    paddingLeft: 8,
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
    flex: 1,
  },
  value: {
    paddingHorizontal: 4,
    paddingVertical: 2,
    paddingLeft: 8,
    fontSize: 14,
  },
});
