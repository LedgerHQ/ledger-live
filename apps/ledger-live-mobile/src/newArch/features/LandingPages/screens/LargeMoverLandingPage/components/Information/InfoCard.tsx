import React from "react";
import { Flex, Text } from "@ledgerhq/native-ui";
import { StyleSheet } from "react-native";

export const InfoCard = ({
  label,
  value,
  bg = "neutral.c30",
  left = false,
}: {
  label: string;
  value: React.ReactNode;
  bg?: string;
  left?: boolean;
}) => (
  <Flex style={[styles.container, left && { marginRight: 12 }]} bg={bg}>
    <Text style={styles.name} color="neutral.c70">
      {label}
    </Text>
    <Text style={styles.value}>{value}</Text>
  </Flex>
);

const styles = StyleSheet.create({
  container: {
    flexDirection: "column",
    padding: 12,
    borderRadius: 16,
    flex: 1,
  },
  name: {
    fontSize: 14,
    paddingBottom: 6,
  },
  value: {
    fontSize: 14,
    fontWeight: "bold",
    textTransform: "uppercase",
  },
});
