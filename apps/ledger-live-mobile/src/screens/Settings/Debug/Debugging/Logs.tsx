import React, { useMemo, useEffect, useState } from "react";
import { listen, Log } from "@ledgerhq/logs";
import { View, StyleSheet, SafeAreaView, FlatList } from "react-native";
import { Flex, Tag, Text } from "@ledgerhq/native-ui";
import logReport from "../../../../log-report";
import Button from "../../../../components/Button";
import useExportLogs from "../../../../components/useExportLogs";
import TextInput from "../../../../components/TextInput";

export default function Logs() {
  const [logs, setLogs] = useState<Log[]>([]);
  const [filter, setFilter] = useState<string>("");

  const onExport = useExportLogs();

  useEffect(() => {
    setLogs(logReport.getLogs());
    listen(() => setLogs(logReport.getLogs()));
  }, []);

  const filteredLogs = useMemo(
    () =>
      logs.filter(
        log => log.type.includes(filter) || log.message?.includes(filter),
      ),
    [filter, logs],
  );

  return (
    <SafeAreaView>
      <Flex p={4} flexDirection="row" justifyContent="space-between">
        <Flex flex={1}>
          <TextInput
            value={filter}
            maxLength={100}
            onChangeText={setFilter}
            placeholder={"Filter the logs"}
          />
        </Flex>
        <Button ml={3} type="shade" iconName={"Share"} onPress={onExport} />
      </Flex>
      <FlatList
        data={filteredLogs}
        keyExtractor={(row: { id: string }) => row.id}
        ListEmptyComponent={() => (
          <View style={styles.logs}>
            <Text color="text">{"No logs matching filter"}</Text>
          </View>
        )}
        renderItem={({ item }) => (
          <View key={item.id} style={styles.row}>
            <Flex flexDirection="row" style={styles.title}>
              <Tag type="color">{item.type}</Tag>
              <Text color="text">{item.date.toTimeString().split(" ")[0]}</Text>
            </Flex>
            <Text color="text" selectable style={styles.pre}>
              {item.message}
            </Text>
            {item?.data ? (
              <Text color="text" selectable style={styles.pre}>
                {JSON.stringify(item.data, null, 2)}
              </Text>
            ) : null}
          </View>
        )}
      />
    </SafeAreaView>
  );
}
const styles = StyleSheet.create({
  logs: {
    flex: 1,
    alignItems: "center",
  },
  button: {
    marginBottom: 20,
  },
  row: {
    justifyContent: "space-between",
    borderBottomWidth: 1,
    paddingTop: 10,
    paddingBottom: 10,
  },
  title: {
    justifyContent: "space-between",
    paddingHorizontal: 10,
  },
  pre: {
    fontFamily: "Menlo",
    padding: 10,
    fontSize: 12,
  },
});
