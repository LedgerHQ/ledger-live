import { ScrollView } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { WalletSyncIntentToolProps } from "../types";
import { headerCopy, logCopy, membersCopy } from "./copy";
import {
  useIntentWalletSyncViewModel,
  type IntentWalletSyncLogLine,
  type IntentWalletSyncViewModel,
} from "./useIntentWalletSyncViewModel";

const SECTION_LX = { paddingHorizontal: "s12", paddingVertical: "s16", gap: "s8" } as const;
const ROW_LX = { flexDirection: "row", alignItems: "center", gap: "s8" } as const;
const LOG_ROW_LX = { flexDirection: "row", flexWrap: "wrap", gap: "s8" } as const;
const ACTIONS_LX = { flexDirection: "row", gap: "s4" } as const;
const PUSH_RIGHT = { marginLeft: "auto" } as const;

function useToolStyles() {
  const { theme } = useTheme();
  const toneColor: Record<IntentWalletSyncLogLine["tone"], string> = {
    neutral: theme.colors.text.base,
    success: theme.colors.text.success,
    warning: theme.colors.text.warning,
    error: theme.colors.text.error,
  };
  return {
    theme,
    toneColor,
    divider: { borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle },
    base: { color: theme.colors.text.base },
    muted: { color: theme.colors.text.muted },
    warning: { color: theme.colors.text.warning },
    mutedMono: { color: theme.colors.text.muted, fontFamily: "monospace" },
  };
}

function IntentWalletSync(props: WalletSyncIntentToolProps) {
  const vm = useIntentWalletSyncViewModel(props);
  const { theme, divider, base, warning } = useToolStyles();

  return (
    <ScrollView>
      <Box lx={SECTION_LX} style={divider}>
        <Box lx={ROW_LX}>
          <Box
            style={{
              width: 8,
              height: 8,
              borderRadius: 4,
              backgroundColor: vm.isRunning
                ? theme.colors.text.success
                : theme.colors.border.mutedSubtle,
            }}
          />
          <Text typography="body2" style={base}>
            {vm.statusLabel}
          </Text>
          <Box lx={ACTIONS_LX} style={PUSH_RIGHT}>
            <Button
              size="sm"
              appearance="accent"
              disabled={!vm.canAddMember}
              onPress={vm.onAddMember}
            >
              {headerCopy.addMember}
            </Button>
            <Button size="sm" appearance="transparent" onPress={vm.onClearLog}>
              {headerCopy.clearLog}
            </Button>
          </Box>
        </Box>
        {vm.warning ? (
          <Text typography="body2" style={warning}>
            {vm.warning}
          </Text>
        ) : null}
      </Box>

      <MembersSection vm={vm} />
      <LogSection lines={vm.logLines} />
    </ScrollView>
  );
}

function MembersSection({ vm }: Readonly<{ vm: IntentWalletSyncViewModel }>) {
  const { divider, base, muted, mutedMono } = useToolStyles();

  return (
    <Box lx={SECTION_LX} style={divider}>
      <Box lx={ROW_LX}>
        <Text typography="body2SemiBold" style={base}>
          {membersCopy.title}
        </Text>
        <Box lx={ACTIONS_LX} style={PUSH_RIGHT}>
          <Button
            size="sm"
            appearance="transparent"
            disabled={!vm.canRefreshMembers}
            onPress={vm.onRefreshMembers}
          >
            {membersCopy.refresh}
          </Button>
        </Box>
      </Box>
      {vm.members === null ? (
        <Text typography="body2" style={muted}>
          {membersCopy.notLoaded}
        </Text>
      ) : null}
      {vm.members?.length === 0 ? (
        <Text typography="body2" style={muted}>
          {membersCopy.empty}
        </Text>
      ) : null}
      {vm.members?.map(member => (
        <Box key={member.id} lx={ROW_LX}>
          <Box style={{ flex: 1 }}>
            <Text typography="body2" style={base} numberOfLines={1}>
              {member.name}
            </Text>
            <Text typography="body3" style={mutedMono} numberOfLines={1}>
              {member.id}
            </Text>
          </Box>
          <Button
            size="sm"
            appearance="transparent"
            disabled={!vm.canRemoveMember}
            onPress={member.onRemove}
            accessibilityLabel={`${membersCopy.remove} ${member.name}`}
          >
            {membersCopy.remove}
          </Button>
        </Box>
      ))}
    </Box>
  );
}

function LogSection({ lines }: Readonly<{ lines: readonly IntentWalletSyncLogLine[] }>) {
  const { base, muted, mutedMono, toneColor } = useToolStyles();

  return (
    <Box lx={SECTION_LX}>
      <Text typography="body2SemiBold" style={base}>
        {logCopy.title}
      </Text>
      {lines.length === 0 ? (
        <Text typography="body2" style={muted}>
          {logCopy.empty}
        </Text>
      ) : null}
      {lines.map(line => (
        <Box key={line.key} lx={LOG_ROW_LX}>
          <Text typography="body3" style={mutedMono}>
            {line.time}
          </Text>
          <Text typography="body3" style={mutedMono}>
            {line.operation}
          </Text>
          <Text typography="body3" style={{ color: toneColor[line.tone], fontFamily: "monospace" }}>
            {line.jobState}
          </Text>
          {line.detail ? (
            <Text typography="body3" style={mutedMono}>
              {line.detail}
            </Text>
          ) : null}
        </Box>
      ))}
    </Box>
  );
}

export default IntentWalletSync;
