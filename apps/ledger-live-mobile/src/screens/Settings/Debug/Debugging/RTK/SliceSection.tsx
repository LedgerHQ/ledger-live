import React, { memo, useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { Flex, Text } from "@ledgerhq/native-ui";
import useStyles from "./style";
import { SliceSectionProps } from "./types";

function SliceSection({ reducerPath, slice, filter, expanded, toggle }: SliceSectionProps) {
  const styles = useStyles();
  const jsonString = useMemo(() => {
    try {
      return JSON.stringify(slice, null, 2);
    } catch (e) {
      return "<unserializable>";
    }
  }, [slice]);

  const matchesFilter =
    !filter ||
    reducerPath.toLowerCase().includes(filter.toLowerCase()) ||
    jsonString.toLowerCase().includes(filter.toLowerCase());
  if (!matchesFilter) return null;

  return (
    <Flex style={styles.section}>
      <TouchableOpacity onPress={() => toggle(reducerPath)}>
        <Text style={styles.sectionHeader}>
          {expanded ? "▼" : "▶"} {reducerPath}
        </Text>
      </TouchableOpacity>
      {expanded ? (
        <Flex style={styles.metaContainer}>
          <Text style={styles.args}>{jsonString}</Text>
        </Flex>
      ) : null}
    </Flex>
  );
}

export default memo(SliceSection);
