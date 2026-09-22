import { ScrollView } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import type { DeviceOnboardingToolProps } from "../types";
import {
  useDeviceOnboardingViewModel,
  type DisplayRow,
  type EventRow,
} from "./useDeviceOnboardingViewModel";

const HEADER_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  padding: "s16",
} as const;
const SECTION_LX = { padding: "s16", gap: "s4" } as const;
const ACTIONS_LX = {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "s8",
  padding: "s16",
} as const;
const ROW_LX = { flexDirection: "row", alignItems: "baseline", gap: "s8" } as const;
const HEADER_ACTIONS_LX = { flexDirection: "row", gap: "s4" } as const;

function DeviceOnboarding(props: DeviceOnboardingToolProps) {
  const vm = useDeviceOnboardingViewModel(props);
  const { theme } = useTheme();
  const divider = { borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle };

  return (
    <ScrollView>
      <Box lx={HEADER_LX} style={divider}>
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
        <Text typography="body2">{vm.statusLabel}</Text>
        {vm.deviceLabel ? (
          <Text typography="body2" numberOfLines={1} style={{ flex: 1 }}>
            {vm.deviceLabel}
          </Text>
        ) : null}
        <Box lx={HEADER_ACTIONS_LX} style={{ marginLeft: "auto" }}>
          <Button size="sm" appearance="accent" disabled={!vm.canConnect} onPress={vm.connect}>
            Connect
          </Button>
          <Button size="sm" appearance="transparent" disabled={!vm.canReset} onPress={vm.reset}>
            Reset
          </Button>
        </Box>
      </Box>

      {vm.error ? (
        <Box lx={SECTION_LX} style={divider}>
          <Text typography="body2" style={{ color: theme.colors.text.error }}>
            {vm.error}
          </Text>
        </Box>
      ) : null}

      <Box lx={SECTION_LX} style={divider}>
        <Text typography="body2">State</Text>
        <Text typography="body2" style={{ fontFamily: "monospace" }}>
          {vm.stateLabel}
        </Text>
      </Box>

      <Box lx={ACTIONS_LX} style={divider}>
        {vm.sendableRows.length === 0 ? (
          <Text typography="body2">No event accepted in this state</Text>
        ) : (
          vm.sendableRows.map(row => (
            <Button
              key={row.key}
              size="sm"
              appearance="transparent"
              disabled={!vm.canSend}
              onPress={() => vm.send(row.event)}
            >
              {row.label}
            </Button>
          ))
        )}
      </Box>

      {vm.exitRows.length > 0 ? <Rows title="Exit" rows={vm.exitRows} /> : null}
      {vm.contextRows.length > 0 ? <Rows title="Context" rows={vm.contextRows} /> : null}

      <Box lx={SECTION_LX}>
        <Text typography="body2">Events</Text>
        {vm.eventRows.length === 0 ? (
          <Text typography="body2">Nothing yet</Text>
        ) : (
          vm.eventRows.map(event => <EventLine key={event.id} event={event} />)
        )}
      </Box>
    </ScrollView>
  );
}

function Rows({ title, rows }: Readonly<{ title: string; rows: readonly DisplayRow[] }>) {
  const { theme } = useTheme();

  return (
    <Box
      lx={SECTION_LX}
      style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
    >
      <Text typography="body2">{title}</Text>
      {rows.map(row => (
        <Box key={row.label} lx={ROW_LX}>
          <Text typography="body2">{row.label}</Text>
          <Text typography="body2" style={{ flex: 1, fontFamily: "monospace" }}>
            {row.value}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

function EventLine({ event }: Readonly<{ event: EventRow }>) {
  return (
    <Box lx={ROW_LX}>
      <Text typography="body2" style={{ fontFamily: "monospace" }}>
        {event.time}
      </Text>
      <Text typography="body2" style={{ fontFamily: "monospace" }}>
        {event.type}
      </Text>
      {event.detail ? (
        <Text typography="body2" numberOfLines={1} style={{ flex: 1, fontFamily: "monospace" }}>
          {event.detail}
        </Text>
      ) : null}
    </Box>
  );
}

export default DeviceOnboarding;
