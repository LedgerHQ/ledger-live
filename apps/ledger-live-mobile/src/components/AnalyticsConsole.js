// @flow
import React, { useState, useCallback, useEffect } from "react";
import { StyleSheet, View, Text } from "react-native";
import { map } from "rxjs/operators";
import useEnv from "@ledgerhq/live-common/hooks/useEnv";
import { trackSubject } from "../analytics/segment";

let id = 0;

const AnalyticsConsole = () => {
  const [items, setItems] = useState([]);
  const filter = useCallback((curr, prev) => {
    if (!prev || !curr.properties) return curr;
    // We repeat a bunch of data over and over again, filter that out unless it changes.
    // Will only work for flat props.
    const keys = Object.keys(curr.properties).filter(
      k => curr?.properties[k] !== prev?.properties[k],
    );
    const properties = keys.reduce(
      (ret, key) => ({ ...ret, [key]: curr.properties[key] }),
      {},
    );
    return { ...curr, properties };
  }, []);

  const addItem = useCallback(item => {
    setItems(currentItems => [...currentItems.slice(-9), item]);
  }, []);

  useEffect(() => {
    trackSubject.pipe(map(item => ({ ...item, id: ++id }))).subscribe(addItem);
  }, [addItem]);
  const render = useEnv("ANALYTICS_CONSOLE");

  return render ? (
    <View style={styles.root} pointerEvents="none">
      {items.map((item, index) => {
        const filteredData = filter(item, items[index - 1]);
        return (
          <View style={styles.item} key={item.id}>
            <Text style={styles.eventName}>{filteredData.event}</Text>
            <Text>
              {filteredData.properties
                ? JSON.stringify(filteredData.properties)
                : null}
            </Text>
          </View>
        );
      })}
    </View>
  ) : null;
};

const styles = StyleSheet.create({
  root: {
    zIndex: 999,
    backgroundColor: "#fffc",
    color: "#000",
    flex: 1,
    position: "absolute",
    opacity: 0.4,
    top: 0,
    left: 0,
    flexDirection: "column-reverse",
  },
  item: {
    padding: 2,
  },
  eventName: {
    fontWeight: "bold",
  },
});

export default AnalyticsConsole;
