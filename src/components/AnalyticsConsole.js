// @flow
import React, { useReducer, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { map } from "rxjs/operators";
import useEnv from "@ledgerhq/live-common/lib/hooks/useEnv";
import { trackSubject } from "../analytics/segment";

let id = 0;

const AnalyticsConsole = () => {
  const [items, addItem] = useReducer(
    (items, item) => (items.length > 10 ? items.slice(1) : items).concat(item),
    [],
  );

  useEffect(() => {
    trackSubject.pipe(map(item => ({ ...item, id: ++id }))).subscribe(addItem);
  }, []);
  const render = useEnv("ANALYTICS_CONSOLE");

  return render ? (
    <View style={styles.root} pointerEvents="none">
      {items.map(item => (
        <View style={styles.item} key={item.id}>
          <Text style={styles.eventName}>{item.event}</Text>
          <Text>
            {item.properties ? JSON.stringify(item.properties) : null}
          </Text>
        </View>
      ))}
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  root: {
    zIndex: 999,
    backgroundColor: "#fffc",
    flex: 1,
    position: "absolute",
    opacity: 0.4,
    top: 0,
    left: 0,
  },
  item: {
    padding: 2,
  },
  eventName: {
    fontWeight: "bold",
  },
});

export default AnalyticsConsole;
