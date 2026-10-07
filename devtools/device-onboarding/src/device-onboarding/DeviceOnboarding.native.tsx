import { useState } from "react";
import { Pressable, ScrollView } from "react-native";
import { Box, Button, Text, useTheme } from "@ledgerhq/lumen-ui-rnative";
import {
  Bluetooth,
  CheckmarkCircle,
  Circles,
  Download,
  ExitLogout,
  Lock,
  Nano,
  ShieldCheck,
  Warning,
} from "@ledgerhq/lumen-ui-rnative/symbols";
import type { DeviceOnboardingToolProps } from "../types";
import {
  useDeviceOnboardingViewModel,
  type DisplayRow,
  type EventRow,
  type StateKind,
  type StateStep,
} from "./useDeviceOnboardingViewModel";

// IconProps is not exported from @ledgerhq/lumen-ui-rnative, so the type comes from a symbol.
type IconComponent = typeof ShieldCheck;

interface StepPresentation {
  readonly Icon: IconComponent;
  readonly backgroundColor:
    | "mutedTransparent"
    | "activeSubtle"
    | "warningTransparent"
    | "errorTransparent"
    | "successTransparent";
  readonly color: "muted" | "active" | "warning" | "error" | "success";
}

const stepPresentation: Record<StateKind, StepPresentation> = {
  progress: { Icon: Circles, backgroundColor: "mutedTransparent", color: "muted" },
  genuine: { Icon: ShieldCheck, backgroundColor: "activeSubtle", color: "active" },
  firmware: { Icon: Download, backgroundColor: "activeSubtle", color: "active" },
  setup: { Icon: Nano, backgroundColor: "activeSubtle", color: "active" },
  locked: { Icon: Lock, backgroundColor: "warningTransparent", color: "warning" },
  session: { Icon: Bluetooth, backgroundColor: "warningTransparent", color: "warning" },
  failed: { Icon: Warning, backgroundColor: "errorTransparent", color: "error" },
  succeeded: { Icon: CheckmarkCircle, backgroundColor: "successTransparent", color: "success" },
  quit: { Icon: ExitLogout, backgroundColor: "mutedTransparent", color: "muted" },
};

const HEADER_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  padding: "s16",
} as const;
const SECTION_LX = { padding: "s16", gap: "s4" } as const;
const BUTTONS_LX = {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "s8",
} as const;
const ROW_LX = { flexDirection: "row", alignItems: "baseline", gap: "s8" } as const;
const HEADER_ACTIONS_LX = { flexDirection: "row", gap: "s4" } as const;
const LOG_LX = { flexDirection: "column", alignItems: "flex-start", gap: "s4" } as const;
const CHIP_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
  paddingHorizontal: "s8",
  paddingVertical: "s4",
  borderRadius: "sm",
} as const;

function DeviceOnboarding(props: DeviceOnboardingToolProps) {
  const vm = useDeviceOnboardingViewModel(props);
  const { theme } = useTheme();
  const divider = { borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle };
  const base = { color: theme.colors.text.base };
  const muted = { color: theme.colors.text.muted };

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
        <Text typography="body2" style={base}>
          {vm.statusLabel}
        </Text>
        {vm.deviceLabel ? (
          <Text typography="body2" numberOfLines={1} style={{ ...muted, flex: 1 }}>
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
        <Box lx={BUTTONS_LX}>
          {vm.sendableRows.length === 0 ? (
            <Text typography="body2" style={muted}>
              No event accepted in this state
            </Text>
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
        <Box lx={{ ...LOG_LX, marginTop: "s16" }}>
          {vm.nextStates.map(row => (
            <Text
              key={`${row.event}-${row.state}`}
              typography="body2"
              style={{ ...muted, fontFamily: "monospace" }}
            >
              {row.event} → {row.state}
            </Text>
          ))}
          {vm.logLines.length === 0 ? (
            <Text typography="body2" style={{ ...muted, fontFamily: "monospace" }}>
              —
            </Text>
          ) : (
            vm.logLines.map(line =>
              line.line === "state" ? (
                <StateChip key={line.key} step={line} />
              ) : (
                <EventLine key={line.id} event={line} />
              ),
            )
          )}
        </Box>
      </Box>

      {vm.exitRows.length > 0 ? <Rows title="Exit" rows={vm.exitRows} /> : null}
      {vm.contextRows.length > 0 ? <Rows title="Context" rows={vm.contextRows} /> : null}
    </ScrollView>
  );
}

function StateChip({ step }: Readonly<{ step: StateStep }>) {
  const { Icon, backgroundColor, color } = stepPresentation[step.kind];
  const { theme } = useTheme();
  const tone = theme.colors.text[color];

  return (
    <Box
      lx={{ ...CHIP_LX, backgroundColor }}
      style={{ borderWidth: 1, borderColor: step.isCurrent ? tone : "transparent" }}
    >
      <Icon size={16} color={color} />
      <Text typography="body2" style={{ color: tone, fontFamily: "monospace" }}>
        {step.label}
      </Text>
    </Box>
  );
}

function Rows({ title, rows }: Readonly<{ title: string; rows: readonly DisplayRow[] }>) {
  const { theme } = useTheme();

  return (
    <Box
      lx={SECTION_LX}
      style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
    >
      <Text typography="body2" style={{ color: theme.colors.text.muted }}>
        {title}
      </Text>
      {rows.map(row => (
        <Box key={row.label} lx={ROW_LX}>
          <Text typography="body2" style={{ color: theme.colors.text.muted }}>
            {row.label}
          </Text>
          <Text
            typography="body2"
            style={{ color: theme.colors.text.base, flex: 1, fontFamily: "monospace" }}
          >
            {row.value}
          </Text>
        </Box>
      ))}
    </Box>
  );
}

function EventLine({ event }: Readonly<{ event: EventRow }>) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const mono = { color: theme.colors.text.base, fontFamily: "monospace" };
  const muted = { color: theme.colors.text.muted };

  return (
    <Box lx={LOG_LX}>
      <Pressable onPress={() => setOpen(current => !current)} accessibilityRole="button">
        <Box lx={ROW_LX}>
          <Text typography="body2" style={{ ...muted, fontFamily: "monospace" }}>
            {event.time}
          </Text>
          <Text typography="body2" style={mono}>
            {event.type}
          </Text>
          {event.detail ? (
            <Text typography="body2" numberOfLines={1} style={{ ...mono, flex: 1 }}>
              {event.detail}
            </Text>
          ) : null}
        </Box>
      </Pressable>
      {open ? (
        <Box lx={{ ...LOG_LX, paddingLeft: "s16" }}>
          {event.payload.length === 0 ? (
            <Text typography="body2" style={{ ...muted, fontFamily: "monospace" }}>
              —
            </Text>
          ) : (
            event.payload.map(row => (
              <Box key={row.label} lx={ROW_LX}>
                <Text typography="body2" style={muted}>
                  {row.label}
                </Text>
                <Text typography="body2" style={{ ...mono, flex: 1 }}>
                  {row.value}
                </Text>
              </Box>
            ))
          )}
        </Box>
      ) : null}
    </Box>
  );
}

export default DeviceOnboarding;
