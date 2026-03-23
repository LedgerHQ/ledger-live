import React from "react";
import { View, StyleSheet } from "react-native";
import { Text } from "@ledgerhq/native-ui";

type Props = {
  items: { label: string; color: string }[];
};

export default function ChartLegend({ items }: Props) {
  return (
    <View style={styles.container}>
      {items.map(item => (
        <View key={item.label} style={styles.item}>
          <View style={[styles.swatch, { backgroundColor: item.color }]} />
          <Text variant="small" color="neutral.c70">
            {item.label}
          </Text>
        </View>
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    gap: 16,
  },
  item: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  swatch: {
    width: 10,
    height: 10,
    borderRadius: 2,
  },
});
