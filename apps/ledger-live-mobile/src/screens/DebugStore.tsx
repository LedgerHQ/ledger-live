/* eslint-disable no-console */
import React, { useCallback, PureComponent } from "react";
import { BigNumber } from "bignumber.js";
import { Text, StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { useTheme } from "@react-navigation/native";
import NavigationScrollView from "../components/NavigationScrollView";
import Button from "../components/Button";
import { SettingsActionTypes } from "../actions/types";
import { State } from "../reducers/types";
import { Theme } from "../colors";

class CollapsibleThingy extends PureComponent<
  {
    obj: Record<string, unknown>;
    depth: number;
    colors: Theme["colors"];
  },
  {
    // eslint-disable-next-line @typescript-eslint/ban-types
    shown: {};
  }
> {
  state = {
    shown: {},
  };
  toggleCollapse = (key: string) =>
    this.setState(prevState => ({
      shown: {
        ...prevState.shown,
        [key]: !prevState.shown[key as keyof typeof prevState.shown],
      },
    }));

  render() {
    const { obj, depth = 0, colors } = this.props;
    const { shown } = this.state;
    return (
      <View>
        {Object.keys(obj || {}).map(key => {
          const rowKey = depth + key;
          const value = obj[key as keyof State];
          const isObject = typeof value === "object";
          const isOpen = shown[rowKey as keyof typeof shown];
          const bullet = isObject ? (isOpen ? "-" : "+") : "";
          return (
            <View
              key={rowKey}
              style={[
                styles.wrapper,
                {
                  backgroundColor: colors.background,
                  borderColor: colors.fog,
                },
              ]}
            >
              <Text
                style={[
                  styles.header,
                  {
                    backgroundColor: colors.background,
                  },
                ]}
                onPress={
                  isObject ? () => this.toggleCollapse(rowKey) : undefined
                }
              >
                {bullet} {key}
              </Text>
              {isObject ? (
                isOpen &&
                value && (
                  <CollapsibleThingy
                    colors={colors}
                    obj={value as Record<string, unknown>}
                    depth={depth + 1}
                  />
                )
              ) : (
                <Text
                  selectable
                  style={[
                    styles.value,
                    {
                      color: colors.smoke,
                      backgroundColor: colors.background,
                    },
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
  const state = useSelector<State, State>(s => s);
  const { colors } = useTheme();
  const dispatch = useDispatch();

  /**
    With remote debugging enabled, trigger this callback
    if you want to override the state, make your changes to the `appState` object
    set the `override` flag to true, and resume execution.
    The store will now have your changes
  */
  const onStoreDebug = useCallback(() => {
    // @ts-expect-error TS does not like this at all.
    window.BigNumber = BigNumber; // NB expose BigNumber to be able to modify the state easier

    // eslint-disable-next-line prefer-const
    let override = false;
    const appState = state;
    if (__DEV__)
      console.log({
        state,
      });
    // eslint-disable-next-line no-debugger
    debugger;

    if (__DEV__ && override) {
      dispatch({
        action: SettingsActionTypes.DANGEROUSLY_OVERRIDE_STATE,
        payload: appState,
      });
    }
  }, [dispatch, state]);
  return (
    <NavigationScrollView>
      <View
        style={{
          padding: 16,
          backgroundColor: "white",
          flex: 1,
        }}
      >
        <Button
          event="DebugState"
          type="primary"
          title={"See on browser (debug on)"}
          containerStyle={{
            marginBottom: 16,
          }}
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
