import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import {
  ListItem,
  ListItemContent,
  ListItemDescription,
  ListItemLeading,
  ListItemTitle,
  ListItemTrailing,
  Text,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import type { AgentActivityItem } from "../../BaanxDashboardScreen/mockAgentsData";

interface Props {
  readonly activity: readonly AgentActivityItem[];
}

const AgentActivitySection = memo(function AgentActivitySection({ activity }: Props) {
  if (activity.length === 0) {
    return (
      <View style={styles.section}>
        <Subheader>
          <SubheaderRow>
            <SubheaderTitle>Activity</SubheaderTitle>
          </SubheaderRow>
        </Subheader>
        <View style={styles.emptyState}>
          <Text typography="body3" lx={{ color: "muted" }}>
            No activity yet
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.section}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>Activity</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <View style={styles.list}>
        {activity.map(item => (
          <ListItem key={item.id}>
            <ListItemLeading>
              <ListItemContent style={listItemContentStyle}>
                <ListItemTitle typography="body2SemiBold" numberOfLines={1}>
                  {item.action}
                </ListItemTitle>
                <ListItemDescription typography="body3" numberOfLines={1}>
                  {item.date}
                </ListItemDescription>
              </ListItemContent>
            </ListItemLeading>
            {item.amount && (
              <ListItemTrailing>
                <Text typography="body2SemiBold" lx={{ color: "base" }}>
                  {item.amount}
                </Text>
              </ListItemTrailing>
            )}
          </ListItem>
        ))}
      </View>
    </View>
  );
});

const listItemContentStyle = { flex: 1, minWidth: 0 };

const styles = StyleSheet.create({
  section: {
    gap: 12,
    paddingBottom: 24,
  },
  list: {
    gap: 0,
  },
  emptyState: {
    alignItems: "center",
    paddingVertical: 24,
  },
});

export default AgentActivitySection;
