// @flow
import React, { useEffect, useCallback, useState } from "react";
import { listen } from "@ledgerhq/logs";
import { ScrollView, View, Text, StyleSheet } from "react-native";
import Share from "react-native-share";
import Button from "../components/Button";

export default function DebugLogs() {
  const [logs, setLogs] = useState([]);
  const prependToLogs = useCallback(
    log => setLogs(currentLogs => [log, ...currentLogs]),
    [],
  );

  useEffect(() => listen(prependToLogs), [prependToLogs]);

  const onExport = async () => {
    const message = JSON.stringify(logs);
    const options = {
      failOnCancel: false,
      saveToFiles: true,
      type: "text/plain",
      message,
    };

    try {
      await Share.open(options);
    } catch (err) {
      // Copied this from the swap history export
    }
  };

  return (
    <View style={styles.wrapper}>
      <Button
        event="ConfirmationModalCancel"
        type="primary"
        containerStyle={styles.button}
        title={"Export logs"}
        onPress={onExport}
      />
      <ScrollView>
        <View>
          {logs.map(log => (
            <Text>{JSON.stringify(log)}</Text>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    padding: 20,
  },
  button: {
    marginBottom: 20,
  },
});
