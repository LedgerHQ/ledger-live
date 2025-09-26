import React, { useMemo } from "react";
import { TouchableOpacity } from "react-native";
import { ApiSectionProps } from "./types";
import { Flex, Text } from "@ledgerhq/native-ui";
import useStyles from "./style";
import QueryItem from "./QueryItem";
import MutationItem from "./MutationItem";

const filterEntriesByEndpointName = <T extends { endpointName?: string }>(
  source: Record<string, T>,
  filterText?: string,
): Array<[string, T]> => {
  const normalized = filterText ? filterText.toLowerCase() : "";
  if (!normalized) return Object.entries(source);
  return Object.entries(source).filter(([, value]) =>
    value?.endpointName?.toLowerCase()?.includes(normalized),
  );
};

function ApiSection({
  reducerPath,
  slice,
  filter,
  expanded,
  toggleApi,
  expandedItems,
  toggleItem,
}: ApiSectionProps) {
  const styles = useStyles();
  const filteredQueries = useMemo(
    () => filterEntriesByEndpointName(slice.queries, filter),
    [slice.queries, filter],
  );

  const filteredMutations = useMemo(
    () => filterEntriesByEndpointName(slice.mutations, filter),
    [slice.mutations, filter],
  );

  return (
    <Flex style={styles.section}>
      <TouchableOpacity onPress={() => toggleApi(reducerPath)}>
        <Text style={styles.sectionHeader}>
          {expanded ? "▼" : "▶"} {reducerPath}
        </Text>
      </TouchableOpacity>
      {expanded && (
        <>
          {filteredQueries.length > 0 && <Text style={styles.subHeader}>Queries</Text>}
          {filteredQueries.map(([key, q]) => (
            <QueryItem
              key={`${reducerPath}-query-${key}`}
              item={q}
              itemKey={`${reducerPath}-query-${key}`}
              expanded={expandedItems[`${reducerPath}-query-${key}`]}
              toggle={toggleItem}
            />
          ))}
          {filteredMutations.length > 0 && <Text style={styles.subHeader}>Mutations</Text>}
          {filteredMutations.map(([key, m]) => (
            <MutationItem
              key={`${reducerPath}-mutation-${key}`}
              item={m}
              itemKey={`${reducerPath}-mutation-${key}`}
              expanded={expandedItems[`${reducerPath}-mutation-${key}`]}
              toggle={toggleItem}
            />
          ))}
        </>
      )}
    </Flex>
  );
}

export default ApiSection;
