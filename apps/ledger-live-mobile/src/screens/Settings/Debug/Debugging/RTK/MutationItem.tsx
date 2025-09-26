import React, { memo } from "react";
import { TouchableOpacity } from "react-native";
import { MutationEntry, ItemProps } from "./types";
import { Flex, Text } from "@ledgerhq/native-ui";
import { STATUS_COLORS } from "./types";
import useStyles from "./style";

function MutationItem({ item, itemKey, expanded, toggle }: ItemProps<MutationEntry>) {
  const styles = useStyles();
  if (!item) return null;
  return (
    <Flex key={itemKey} style={styles.item}>
      <TouchableOpacity onPress={() => toggle(itemKey)}>
        <Text style={[styles.key]} color={STATUS_COLORS[item.status ?? "default"]}>
          {item.endpointName ?? itemKey} ({item.status})
        </Text>
      </TouchableOpacity>
      {expanded && (
        <Flex style={styles.metaContainer}>
          {item.requestId && <Text style={styles.meta}>ReqId: {item.requestId}</Text>}
          {typeof item.originalArgs !== "undefined" && (
            <Text style={styles.args}>Args: {JSON.stringify(item.originalArgs)}</Text>
          )}
        </Flex>
      )}
    </Flex>
  );
}

export default memo(MutationItem);
