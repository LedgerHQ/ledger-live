import React, { memo } from "react";
import { View, StyleSheet } from "react-native";
import { Text, Spot, Tag, Button } from "@ledgerhq/lumen-ui-rnative";
import { UserCircle } from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { AgentStatus } from "../../BaanxDashboardScreen/mockAgentsData";

interface Props {
  readonly name: string;
  readonly status: AgentStatus;
  readonly iconComponent: typeof UserCircle;
  readonly onFundAgent: () => void;
  readonly onWithdraw: () => void;
}

const AgentHeaderSection = memo(function AgentHeaderSection({
  name,
  status,
  iconComponent,
  onFundAgent,
  onWithdraw,
}: Props) {
  const { theme } = useTheme();
  const isActive = status === "active";

  return (
    <View style={[styles.container, { backgroundColor: theme.colors.bg.surface }]}>
      <Spot appearance="icon" icon={iconComponent} size={56} />

      <Text typography="heading3SemiBold" lx={{ color: "base" }}>
        {name}
      </Text>

      <Tag appearance={isActive ? "success" : "base"} label={isActive ? "Active" : "Idle"} />

      <View style={styles.actions}>
        <Button appearance="base" size="md" lx={{ flex: 1 }} onPress={onFundAgent}>
          Fund Agent
        </Button>
        <Button appearance="transparent" size="md" lx={{ flex: 1 }} onPress={onWithdraw}>
          Withdraw
        </Button>
      </View>
    </View>
  );
});

const styles = StyleSheet.create({
  container: {
    alignItems: "center",
    borderRadius: 12,
    padding: 24,
    gap: 12,
  },
  actions: {
    flexDirection: "row",
    gap: 12,
    width: "100%",
    marginTop: 4,
  },
});

export default AgentHeaderSection;
