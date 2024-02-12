/* eslint-disable no-console */
import React, { useCallback, useState } from "react";
import styled from "styled-components/native";
import { get, set, cloneDeep } from "lodash";
import { BigNumber } from "bignumber.js";
import { StyleSheet, SafeAreaView, ScrollView } from "react-native";
import { useDispatch, useSelector } from "react-redux";
import { Alert, Flex } from "@ledgerhq/native-ui";
import { useTheme } from "@react-navigation/native";
import Share from "react-native-share";
import Node from "./Node";
import logger from "../../../../logger";
import { dangerouslyOverrideState } from "~/actions/settings";
import Button from "~/components/Button";
import { SettingsActionTypes } from "~/actions/types";
import { State } from "~/reducers/types";
import QueuedDrawer from "~/components/QueuedDrawer";
import TextInput from "~/components/FocusedTextInput";

const Separator = styled(Flex).attrs({
  width: "100%",
  my: 2,
  height: 1,
  bg: "neutral.c40",
})``;

export default function Store() {
  const state = useSelector<State, State>(s => s);
  const { colors } = useTheme();

  const [hasMadeChanges, setHasMadeChanges] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [targetPath, setTargetPath] = useState("");
  const [targetType, setTargetType] = useState("string");
  const [modifiedState, setModifiedState] = useState<State>(cloneDeep(state));
  const currentValue = get(modifiedState, targetPath);

  const dispatch = useDispatch();

  const onEdit = useCallback(
    (path: string, type: string) => {
      const currentValue = get(modifiedState, path);
      setTargetType(type);

      if (type === "boolean") {
        setModifiedState(s => ({ ...set(s, path, !currentValue) }));
        setHasMadeChanges(!currentValue !== get(state, path));
      } else if (type === "string" || type === "number") {
        setTargetPath(path);
        setIsModalOpen(true);
      }
    },
    [modifiedState, state],
  );

  const onChangeText = useCallback(
    // @ts-expect-error string | number but it means casting in the function
    value => {
      const currentValue = get(state, targetPath);

      let processedValue = value;
      if (targetType === "number") {
        processedValue = parseInt(value, 10);
      }
      if (processedValue === currentValue) {
        setHasMadeChanges(false);
      } else {
        setModifiedState(s => ({ ...set(s, targetPath, processedValue) }));
        setHasMadeChanges(true);
      }
    },
    [state, targetPath, targetType],
  );

  const onConfirm = useCallback(() => {
    dispatch(dangerouslyOverrideState(modifiedState));
    setHasMadeChanges(false);
    setIsModalOpen(false);
  }, [dispatch, modifiedState]);

  const onRestore = useCallback(() => {
    if (hasMadeChanges) {
      // Nb without this we'd restore on close always, trust me.
      setModifiedState(cloneDeep(state));
      setHasMadeChanges(false);
    }
    setIsModalOpen(false);
  }, [hasMadeChanges, state]);

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

  const onExportState = () => {
    const exportState = async () => {
      const base64 = Buffer.from(JSON.stringify(state)).toString("base64");
      const date = new Date().toISOString().split("T")[0];
      const humanReadableName = `ledger-live-mob-${date}-state`;

      const options = {
        failOnCancel: false,
        saveToFiles: true,
        type: "application/json",
        filename: humanReadableName,
        url: `data:application/json;base64,${base64}`,
      };

      try {
        await Share.open(options);
      } catch (err) {
        if ((err as { error?: { code?: string } })?.error?.code !== "ECANCELLED500") {
          logger.critical(err as Error);
        }
      }
    };
    exportState();
  };
  return (
    <SafeAreaView>
      <Flex p={4}>
        {hasMadeChanges ? (
          <Alert type="warning" title="Changes are not persisted until you confirm." />
        ) : (
          <Alert type="info" title="Read and modify the application state." />
        )}
      </Flex>
      <Flex p={4} flexDirection="row" justifyContent="space-between">
        <Button
          flex={1}
          type="color"
          title={"Confirm"}
          disabled={!hasMadeChanges}
          onPress={onConfirm}
        />
        <Button
          flex={1}
          ml={3}
          type="shade"
          title={"Restore"}
          disabled={!hasMadeChanges}
          onPress={onRestore}
        />
        <Button ml={3} type="shade" iconName={"Share"} onPress={onExportState} />
        {__DEV__ ? (
          <Button ml={3} type="shade" iconName={"Warning"} onPress={onStoreDebug} />
        ) : null}
      </Flex>
      <Separator />
      <ScrollView contentContainerStyle={{ flex: 0, paddingBottom: 170 }}>
        {/* @ts-expect-error onEdit gives (a: string, type?: string) => but our function needs type (and it seems always defined anyway) */}
        <Node data={modifiedState} onEdit={onEdit} />
      </ScrollView>
      <QueuedDrawer isRequestingToBeOpened={isModalOpen} onClose={onRestore}>
        <Alert
          type="error"
          title="Setting an invalid value may corrupt your app state requiring a full app reinstall."
        />
        <TextInput
          style={[styles.input, { color: colors.darkBlue }]}
          value={String(currentValue)}
          onChangeText={onChangeText}
          autoFocus
          autoCorrect={false}
          selectTextOnFocus
          blurOnSubmit={true}
          clearButtonMode="always"
          placeholder={String(currentValue)}
        />
        <Button
          mt={4}
          event="DebugState"
          type="primary"
          title={"Confirm"}
          disabled={!hasMadeChanges}
          onPress={onConfirm}
        />
      </QueuedDrawer>
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
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
  input: {
    fontSize: 16,
    padding: 16,
  },
});
