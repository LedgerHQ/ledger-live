/* eslint-disable no-console */
import React, { useCallback, useState } from "react";
import { BigNumber } from "bignumber.js";
import { StyleSheet, View } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Text } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import NavigationScrollView from "../../../../components/NavigationScrollView";
import Button from "../../../../components/Button";
import { SettingsActionTypes } from "../../../../actions/types";
import { State } from "../../../../reducers/types";

type Props = {
  data: Partial<{ [key in keyof State]: unknown }>;
  depth: number;
};

const Node = ({ data = {}, depth }: Props) => {
  const [shown, setShown] = useState<{ [key: string]: boolean }>({});
  const { colors } = useTheme();

  const toggleCollapse = (key: string) => {
    setShown(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <View>
      {Object.keys(data || {}).map(key => {
        const rowKey = depth + key;
        const value = data[key as keyof State];
        const isObject = typeof value === "object";
        const isOpen = shown[rowKey as keyof typeof shown];
        const bullet = isObject ? (isOpen ? "-" : "+") : "";

        return (
          <View
            key={rowKey}
            style={[
              styles.wrapper,
              { borderColor: colors.black },
              depth === 1 ? { borderLeftWidth: 0 } : {},
            ]}
          >
            <Text
              style={[styles.header, { borderColor: colors.black }]}
              variant="body"
              onPress={isObject ? () => toggleCollapse(rowKey) : undefined}
            >
              {bullet} {key}
            </Text>
            {isObject ? (
              isOpen &&
              value && (
                <Node
                  data={value as Record<string, unknown>}
                  depth={depth + 1}
                />
              )
            ) : (
              <Text
                selectable
                variant="body"
                style={[styles.value, { borderColor: colors.black }]}
              >{`(${typeof value}) ${value}`}</Text>
            )}
          </View>
        );
      })}
    </View>
  );
};

export default function Store() {
  const state = useSelector<State, State>(s => s);
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
          flex: 1,
        }}
      >
        <Button
          event="DebugState"
          type="primary"
          title={"See on browser (debug on)"}
          containerStyle={{
            margin: 16,
          }}
          onPress={onStoreDebug}
        />
        <Node data={state} depth={1} />
      </View>
    </NavigationScrollView>
  );
}
const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
    borderLeftWidth: 14,
  },
  buttonStyle: {
    marginBottom: 16,
  },
  header: {
    padding: 8,
    flex: 1,
  },
  value: {
    padding: 8,
    opacity: 0.7,
  },
});
