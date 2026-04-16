import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Subheader, SubheaderRow, SubheaderTitle } from "@ledgerhq/lumen-ui-rnative";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";

interface Props {
  readonly role: string;
}

const AgentRoleSection = memo(function AgentRoleSection({ role }: Props) {
  const { theme } = useTheme();

  return (
    <View style={styles.section}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>Role</SubheaderTitle>
        </SubheaderRow>
      </Subheader>

      <View style={[styles.card, { backgroundColor: theme.colors.bg.surface }]}>
        <Text typography="body2" lx={{ color: "base" }}>
          {role}
        </Text>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    gap: 12,
  },
  card: {
    borderRadius: 12,
    padding: 16,
  },
});

export default AgentRoleSection;
