import React, { memo, useCallback } from "react";
import { Pressable, ScrollView, View, StyleSheet } from "react-native";
import {
  Text,
  Spot,
  IconButton,
  Subheader,
  SubheaderRow,
  SubheaderTitle,
} from "@ledgerhq/lumen-ui-rnative";
import {
  UserCircle,
  UserShield,
  UserCheck,
  UserArrowRight,
  UserLock,
  Plus,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import { useTheme } from "@ledgerhq/lumen-ui-rnative/styles";
import type { AgentData } from "../mockAgentsData";

const TILE_WIDTH = 106;

const ICON_MAP: Record<AgentData["icon"], typeof UserCircle> = {
  UserCircle,
  UserShield,
  UserCheck,
  UserArrowRight,
  UserLock,
};

function formatBalance(value: number): string {
  if (value === 0) return "$0";
  if (value >= 1_000) {
    return `$${value.toLocaleString("en-US", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
  }
  return `$${value.toFixed(2)}`;
}

interface AgentTileProps {
  readonly agent: AgentData;
  readonly onPress: (id: string) => void;
}

function formatPnl(percent: number): string {
  const sign = percent >= 0 ? "+" : "";
  return `${sign}${percent.toFixed(1)}%`;
}

const AgentTile = memo(function AgentTile({ agent, onPress }: AgentTileProps) {
  const { theme } = useTheme();
  const IconComponent = ICON_MAP[agent.icon];
  const statusColor =
    agent.status === "active" ? theme.colors.text.success ?? "#47883a" : theme.colors.text.muted;

  const hasPnl = agent.pnlChartData.length > 0;

  const handlePress = useCallback(() => {
    onPress(agent.id);
  }, [onPress, agent.id]);

  return (
    <Pressable
      style={[styles.tile, { backgroundColor: theme.colors.bg.surface }]}
      onPress={handlePress}
    >
      <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
      <Spot appearance="icon" icon={IconComponent} size={48} />
      <View style={styles.tileText}>
        <Text typography="body2SemiBold" lx={{ color: "base" }} numberOfLines={1}>
          {agent.name}
        </Text>
        <Text typography="body3" lx={{ color: "muted" }} numberOfLines={1}>
          {formatBalance(agent.balance)}
        </Text>
        {hasPnl && (
          <Text
            typography="body3"
            lx={{ color: agent.pnlPercent >= 0 ? "success" : "error" }}
            numberOfLines={1}
          >
            {formatPnl(agent.pnlPercent)}
          </Text>
        )}
      </View>
    </Pressable>
  );
});

interface Props {
  readonly agents: readonly AgentData[];
  readonly onAgentPress: (agentId: string) => void;
  readonly onCreateAgent: () => void;
}

const AgentsSection = memo(function AgentsSection({ agents, onAgentPress, onCreateAgent }: Props) {
  return (
    <View style={styles.section}>
      <Subheader>
        <SubheaderRow>
          <SubheaderTitle>Agents</SubheaderTitle>
          <View style={styles.spacer} />
          <IconButton
            icon={Plus}
            size="sm"
            appearance="transparent"
            accessibilityLabel="Create agent"
            onPress={onCreateAgent}
          />
        </SubheaderRow>
      </Subheader>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.list}
      >
        {agents.map(agent => (
          <AgentTile key={agent.id} agent={agent} onPress={onAgentPress} />
        ))}
      </ScrollView>
    </View>
  );
});

const styles = StyleSheet.create({
  section: {
    gap: 12,
    paddingBottom: 24,
  },
  spacer: {
    flex: 1,
  },
  list: {
    gap: 10,
  },
  tile: {
    position: "relative",
    width: TILE_WIDTH,
    borderRadius: 12,
    paddingHorizontal: 8,
    paddingVertical: 12,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  statusDot: {
    position: "absolute",
    top: 8,
    right: 8,
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  tileText: {
    gap: 4,
    alignItems: "center",
    width: "100%",
  },
});

export default AgentsSection;
