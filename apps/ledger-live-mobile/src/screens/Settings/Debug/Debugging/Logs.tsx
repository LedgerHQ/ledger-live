import React, { useEffect, useCallback, useState } from "react";
import { listen, Log } from "@ledgerhq/logs";
import { ScrollView, View, StyleSheet } from "react-native";
import logReport from "../../../../log-report";
import Button from "../../../../components/Button";
import LText from "../../../../components/LText";
import useExportLogs from "../../../../components/useExportLogs";

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const prependToLogs = useCallback(
    (log: Log) => setLogs(currentLogs => [log, ...currentLogs]),
    [],
  );
  useEffect(() => listen(prependToLogs), [prependToLogs]);
  const onExport = useExportLogs();

  const onDisplayLatestLogs = () => {
    setLogs(logReport.getLogs());
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
      <Button
        type="primary"
        containerStyle={styles.button}
        title={"Display latest logs"}
        onPress={onDisplayLatestLogs}
      />
      <ScrollView>
        <View>
          {logs.map((log, index) => (
            <LText color="text" key={index}>
              {JSON.stringify(log)}
            </LText>
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
