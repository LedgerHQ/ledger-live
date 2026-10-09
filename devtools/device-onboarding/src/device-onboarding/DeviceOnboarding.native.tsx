import { Fragment, useState, type ReactNode } from "react";
import { Pressable, ScrollView, Share } from "react-native";
import {
  Box,
  Button,
  SegmentedControl,
  SegmentedControlButton,
  Switch,
  Text,
  useTheme,
} from "@ledgerhq/lumen-ui-rnative";
import {
  Bluetooth,
  CheckmarkCircle,
  ChevronDown,
  ChevronRight,
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
  emptyLogCopy,
  featureFlagCopy,
  logCopy,
  openNextScreenCopy,
  overrideCopy,
} from "./configCopy";
import {
  possibleByEvent,
  useDeviceOnboardingViewModel,
  type DeviceOnboardingViewModel,
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
  flexDirection: "column",
  gap: "s8",
  padding: "s16",
} as const;
const HEADER_ROW_LX = {
  flexDirection: "row",
  alignItems: "center",
  gap: "s8",
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
  const [tab, setTab] = useState<"log" | "config">("log");
  const divider = { borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle };
  const base = { color: theme.colors.text.base };
  const muted = { color: theme.colors.text.muted };

  return (
    <ScrollView>
      <Box lx={HEADER_LX} style={divider}>
        <Box lx={HEADER_ROW_LX}>
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
          <Box lx={HEADER_ACTIONS_LX} style={{ marginLeft: "auto" }}>
            <Button size="sm" appearance="accent" disabled={!vm.canConnect} onPress={vm.connect}>
              Connect
            </Button>
            <Button size="sm" appearance="transparent" disabled={!vm.canReset} onPress={vm.reset}>
              Reset
            </Button>
          </Box>
        </Box>
        {vm.deviceLabel ? (
          <Text typography="body2" style={muted}>
            {vm.deviceLabel}
          </Text>
        ) : null}
        {vm.contextRows.length > 0 ? <ContextLines rows={vm.contextRows} /> : null}
        <SegmentedControl selectedValue={tab} onSelectedChange={setTab} accessibilityLabel="Screen">
          <SegmentedControlButton value="log">Log</SegmentedControlButton>
          <SegmentedControlButton value="config">Config</SegmentedControlButton>
        </SegmentedControl>
      </Box>
      {vm.error ? (
        <Box lx={SECTION_LX} style={divider}>
          <Text typography="body2" style={{ color: theme.colors.text.error }}>
            {vm.error}
          </Text>
        </Box>
      ) : null}

      {tab === "config" ? (
        <>
          <OverrideSection vm={vm} />
          {vm.featureFlagRows.length > 0 ? <FeatureFlagSection rows={vm.featureFlagRows} /> : null}
          {vm.setShowNextScreen ? (
            <Box lx={SECTION_LX} style={divider}>
              <Box lx={HEADER_ROW_LX}>
                <Box lx={{ flexDirection: "column", gap: "s4", flexShrink: 1 }}>
                  <Text typography="body2" style={base}>
                    {openNextScreenCopy.title}
                  </Text>
                  <Text typography="body2" style={muted}>
                    {openNextScreenCopy.description}
                  </Text>
                </Box>
                <Box style={{ marginLeft: "auto" }}>
                  <Switch
                    checked={vm.showNextScreen}
                    onCheckedChange={vm.setShowNextScreen}
                    accessibilityLabel={openNextScreenCopy.title}
                  />
                </Box>
              </Box>
            </Box>
          ) : null}
        </>
      ) : null}

      {tab === "log" && vm.logIsEmpty ? (
        <Box lx={SECTION_LX} style={divider}>
          <Text typography="body2" style={base}>
            {emptyLogCopy.title}
          </Text>
          <Text typography="body2" style={muted}>
            {emptyLogCopy.description}
          </Text>
        </Box>
      ) : null}

      {tab === "log" && !vm.logIsEmpty ? (
        <Box lx={SECTION_LX} style={divider}>
          <Box lx={BUTTONS_LX}>
            {vm.sendableRows.length === 0 ? (
              <Text typography="body2" style={muted}>
                {logCopy.noEvent}
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
            {vm.logLines.length === 0 ? (
              <Text typography="body2" style={{ ...muted, fontFamily: "monospace" }}>
                —
              </Text>
            ) : (
              vm.logLines.map(line =>
                line.line === "state" ? (
                  <Fragment key={line.key}>
                    <StateChip step={line} />
                    {line.isCurrent ? <PossibleEvents rows={vm.nextStates} /> : null}
                  </Fragment>
                ) : (
                  <EventLine key={line.id} event={line} />
                ),
              )
            )}
          </Box>
          <Button
            size="sm"
            appearance="transparent"
            onPress={() =>
              void Share.share({
                title: "Device onboarding logs",
                message: vm.exportLogs(),
              })
            }
          >
            {logCopy.export}
          </Button>
        </Box>
      ) : null}
    </ScrollView>
  );
}

function OverrideSection({ vm }: Readonly<{ vm: DeviceOnboardingViewModel }>) {
  const { theme } = useTheme();
  const base = { color: theme.colors.text.base };
  const muted = { color: theme.colors.text.muted };

  return (
    <Box
      lx={SECTION_LX}
      style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
    >
      <Text typography="body2" style={base}>
        {overrideCopy.title}
      </Text>
      <Text typography="body2" style={muted}>
        {overrideCopy.description}
      </Text>
      {vm.overrideRows.map(row => (
        <OverrideRow key={row.key} label={row.label}>
          <SegmentedControl
            selectedValue={row.value}
            onSelectedChange={row.onChange}
            accessibilityLabel={row.label}
          >
            {row.options.map(option => (
              <SegmentedControlButton key={option.value} value={option.value}>
                {option.label}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </OverrideRow>
      ))}
    </Box>
  );
}

function FeatureFlagSection({
  rows,
}: Readonly<{ rows: DeviceOnboardingViewModel["featureFlagRows"] }>) {
  const { theme } = useTheme();
  const base = { color: theme.colors.text.base };
  const muted = { color: theme.colors.text.muted };

  return (
    <Box
      lx={SECTION_LX}
      style={{ borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle }}
    >
      <Text typography="body2" style={base}>
        {featureFlagCopy.title}
      </Text>
      <Text typography="body2" style={muted}>
        {featureFlagCopy.description}
      </Text>
      {rows.map(row => (
        <Box key={row.key} lx={HEADER_ROW_LX}>
          <Text typography="body2" style={{ ...base, fontFamily: "monospace" }}>
            {row.label}
          </Text>
          <Box style={{ marginLeft: "auto" }}>
            <Switch
              checked={row.checked}
              onCheckedChange={row.onChange}
              accessibilityLabel={row.label}
            />
          </Box>
        </Box>
      ))}
    </Box>
  );
}

function OverrideRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  const { theme } = useTheme();

  return (
    <Box lx={{ flexDirection: "column", alignItems: "flex-start", gap: "s8" }}>
      <Text typography="body2" style={{ color: theme.colors.text.base }}>
        {label}
      </Text>
      {children}
    </Box>
  );
}

function PossibleEvents({ rows }: Readonly<{ rows: DeviceOnboardingToolProps["nextStates"] }>) {
  const { theme } = useTheme();
  const groups = possibleByEvent(rows);
  if (groups.length === 0) return null;

  const muted = { color: theme.colors.text.muted, fontFamily: "monospace" };

  return (
    <Box lx={LOG_LX} style={{ opacity: 0.55 }}>
      {groups.map(group => (
        <Box key={group.event} lx={{ ...LOG_LX, paddingLeft: "s16" }}>
          <Text typography="body2" style={muted}>
            {group.event}
          </Text>
          {group.states.map((state, index) => (
            <Text
              key={`${index}-${state}`}
              typography="body2"
              style={{ ...muted, paddingLeft: 16 }}
            >
              {state}
            </Text>
          ))}
        </Box>
      ))}
    </Box>
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

function ContextLines({ rows }: Readonly<{ rows: readonly DisplayRow[] }>) {
  const [open, setOpen] = useState(false);
  const { theme } = useTheme();
  const muted = { color: theme.colors.text.muted };
  const mono = { color: theme.colors.text.base, fontFamily: "monospace" };

  return (
    <Box lx={LOG_LX}>
      <Pressable
        onPress={() => setOpen(current => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Box lx={ROW_LX}>
          {open ? (
            <ChevronDown size={16} color="muted" />
          ) : (
            <ChevronRight size={16} color="muted" />
          )}
          <Text typography="body2" style={muted}>
            {logCopy.context}
          </Text>
        </Box>
      </Pressable>
      {open
        ? rows.map(row => (
            <Box key={row.label} lx={{ ...ROW_LX, paddingLeft: "s16" }}>
              <Text typography="body2" style={muted}>
                {row.label}
              </Text>
              <Text typography="body2" style={{ ...mono, flex: 1 }}>
                {row.value}
              </Text>
            </Box>
          ))
        : null}
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
      <Pressable
        onPress={() => setOpen(current => !current)}
        accessibilityRole="button"
        accessibilityState={{ expanded: open }}
      >
        <Box lx={ROW_LX}>
          {open ? (
            <ChevronDown size={16} color="muted" />
          ) : (
            <ChevronRight size={16} color="muted" />
          )}
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
        <Box lx={LOG_LX} style={{ paddingLeft: 16 }}>
          {event.payload.length === 0 ? (
            <Text typography="body2" style={{ ...muted, fontFamily: "monospace" }}>
              —
            </Text>
          ) : (
            event.payload.map((row, index) => (
              <Box key={`${index}-${row.label}`} lx={ROW_LX}>
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
