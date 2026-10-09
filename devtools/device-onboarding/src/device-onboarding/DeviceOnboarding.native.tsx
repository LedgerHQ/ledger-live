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
  headerCopy,
  featureFlagCopy,
  logCopy,
  machineCopy,
  openNextScreenCopy,
  overrideCopy,
} from "./configCopy";
import {
  useDeviceOnboardingViewModel,
  type DeviceOnboardingViewModel,
  type DisplayRow,
  type EventRow,
  machineLegend,
  type MachineBadge,
  type MachineEmphasis,
  type MachineRow,
  type MachineTone,
  type NextStateGroup,
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

function useToolStyles() {
  const { theme } = useTheme();
  return {
    theme,
    divider: { borderBottomWidth: 1, borderColor: theme.colors.border.mutedSubtle },
    base: { color: theme.colors.text.base },
    muted: { color: theme.colors.text.muted },
    mono: { color: theme.colors.text.base, fontFamily: "monospace" },
    mutedMono: { color: theme.colors.text.muted, fontFamily: "monospace" },
  };
}

function DeviceOnboarding(props: DeviceOnboardingToolProps) {
  const vm = useDeviceOnboardingViewModel(props);
  const { theme, divider, base, muted } = useToolStyles();
  const [tab, setTab] = useState<"log" | "config" | "machine">("log");

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
              {headerCopy.connect}
            </Button>
            <Button size="sm" appearance="transparent" disabled={!vm.canReset} onPress={vm.reset}>
              {headerCopy.reset}
            </Button>
          </Box>
        </Box>
        {vm.deviceLabel ? (
          <Text typography="body2" style={muted}>
            {vm.deviceLabel}
          </Text>
        ) : null}
        {vm.contextRows.length > 0 ? (
          <Disclosure
            label={
              <Text typography="body2" style={muted}>
                {logCopy.context}
              </Text>
            }
            rows={vm.contextRows}
          />
        ) : null}
        <SegmentedControl
          selectedValue={tab}
          onSelectedChange={setTab}
          accessibilityLabel={headerCopy.tabs}
        >
          <SegmentedControlButton value="log">{headerCopy.log}</SegmentedControlButton>
          <SegmentedControlButton value="config">{headerCopy.config}</SegmentedControlButton>
          <SegmentedControlButton value="machine">{machineCopy.tab}</SegmentedControlButton>
        </SegmentedControl>
      </Box>
      {vm.error ? (
        <Box lx={SECTION_LX} style={divider}>
          <Text typography="body2" style={{ color: theme.colors.text.error }}>
            {vm.error}
          </Text>
        </Box>
      ) : null}

      {tab === "log" ? <LogTab vm={vm} /> : null}
      {tab === "config" ? <ConfigTab vm={vm} /> : null}
      {tab === "machine" ? <MachineSection rows={vm.machineRows} /> : null}
    </ScrollView>
  );
}

function OverrideSection({ vm }: Readonly<{ vm: DeviceOnboardingViewModel }>) {
  const { divider } = useToolStyles();

  return (
    <Box lx={SECTION_LX} style={divider}>
      <SectionHeader title={overrideCopy.title} description={overrideCopy.description} />
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

function ConfigTab({ vm }: Readonly<{ vm: DeviceOnboardingViewModel }>) {
  const { divider } = useToolStyles();

  return (
    <>
      <OverrideSection vm={vm} />
      {vm.featureFlagRows.length > 0 ? <FeatureFlagSection rows={vm.featureFlagRows} /> : null}
      {vm.setShowNextScreen ? (
        <Box lx={SECTION_LX} style={divider}>
          <Box lx={HEADER_ROW_LX}>
            <Box lx={{ flexDirection: "column", gap: "s4", flexShrink: 1 }}>
              <SectionHeader {...openNextScreenCopy} />
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
  );
}

function LogTab({ vm }: Readonly<{ vm: DeviceOnboardingViewModel }>) {
  const { divider, muted } = useToolStyles();

  if (vm.logIsEmpty) {
    return (
      <Box lx={SECTION_LX} style={divider}>
        <SectionHeader {...emptyLogCopy} />
      </Box>
    );
  }

  return (
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
        {vm.logLines.map(line =>
          line.line === "state" ? (
            <Fragment key={line.key}>
              <StateChip step={line} />
              {line.isCurrent ? <PossibleEvents groups={vm.nextStateGroups} /> : null}
            </Fragment>
          ) : (
            <EventLine key={line.id} event={line} />
          ),
        )}
      </Box>
      <Button
        size="sm"
        appearance="transparent"
        onPress={() =>
          void Share.share({
            title: logCopy.shareTitle,
            message: vm.exportLogs(),
          })
        }
      >
        {logCopy.export}
      </Button>
    </Box>
  );
}

const stateColor: Record<MachineEmphasis, "active" | "base" | "muted"> = {
  current: "active",
  active: "base",
  idle: "muted",
};

const tonePresentation: Record<MachineTone, Pick<StepPresentation, "backgroundColor" | "color">> = {
  active: { backgroundColor: "activeSubtle", color: "active" },
  success: { backgroundColor: "successTransparent", color: "success" },
  warning: { backgroundColor: "warningTransparent", color: "warning" },
  error: { backgroundColor: "errorTransparent", color: "error" },
  muted: { backgroundColor: "mutedTransparent", color: "muted" },
};

const WRAP_ROW_LX = {
  flexDirection: "row",
  flexWrap: "wrap",
  alignItems: "center",
  gap: "s8",
} as const;

function MachineSection({ rows }: Readonly<{ rows: readonly MachineRow[] }>) {
  const { theme, divider, muted, mono, mutedMono } = useToolStyles();

  return (
    <Box lx={SECTION_LX} style={divider}>
      <Text typography="body2" style={muted}>
        {machineCopy.description}
      </Text>
      <Box lx={WRAP_ROW_LX}>
        {machineLegend.map(item => (
          <Badge key={item.label} {...item} />
        ))}
      </Box>
      {rows.map(row => (
        <Box key={row.key} lx={LOG_LX} style={{ paddingLeft: row.depth * 16 }}>
          <Box lx={WRAP_ROW_LX}>
            <Box
              lx={row.emphasis === "current" ? { ...CHIP_LX, backgroundColor: "activeSubtle" } : {}}
            >
              <Text
                typography={row.emphasis === "current" ? "body2SemiBold" : "body2"}
                style={{
                  color: theme.colors.text[stateColor[row.emphasis]],
                  fontFamily: "monospace",
                }}
                accessibilityState={{ selected: row.emphasis === "current" }}
              >
                {row.label}
              </Text>
            </Box>
            {row.badges.map(badge => (
              <Badge key={badge.label} {...badge} />
            ))}
          </Box>
          {row.transitions.map(transition => (
            <Box key={transition.key} lx={WRAP_ROW_LX} style={{ paddingLeft: 16 }}>
              <Badge label={transition.event} tone={transition.tone} />
              <Text typography="body2" style={muted}>
                →
              </Text>
              <Text typography="body2" style={transition.target ? mono : mutedMono}>
                {transition.target ?? machineCopy.stay}
              </Text>
              {transition.guard ? (
                <Text typography="body2" style={muted}>
                  {machineCopy.guard} {transition.guard}
                </Text>
              ) : null}
            </Box>
          ))}
        </Box>
      ))}
    </Box>
  );
}

function Badge({ label, tone }: Readonly<MachineBadge>) {
  const { theme } = useTheme();
  const { backgroundColor, color } = tonePresentation[tone];

  return (
    <Box lx={{ paddingHorizontal: "s4", borderRadius: "sm", backgroundColor }}>
      <Text typography="body2" style={{ color: theme.colors.text[color], fontFamily: "monospace" }}>
        {label}
      </Text>
    </Box>
  );
}

function FeatureFlagSection({
  rows,
}: Readonly<{ rows: DeviceOnboardingViewModel["featureFlagRows"] }>) {
  const { divider, mono } = useToolStyles();

  return (
    <Box lx={SECTION_LX} style={divider}>
      <SectionHeader {...featureFlagCopy} />
      {rows.map(row => (
        <Box key={row.key} lx={HEADER_ROW_LX}>
          <Text typography="body2" style={mono}>
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
  const { base } = useToolStyles();

  return (
    <Box lx={{ flexDirection: "column", alignItems: "flex-start", gap: "s8" }}>
      <Text typography="body2" style={base}>
        {label}
      </Text>
      {children}
    </Box>
  );
}

function PossibleEvents({ groups }: Readonly<{ groups: readonly NextStateGroup[] }>) {
  const { mutedMono: muted } = useToolStyles();
  if (groups.length === 0) return null;

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

function SectionHeader({ title, description }: Readonly<{ title: string; description: string }>) {
  const { base, muted } = useToolStyles();

  return (
    <>
      <Text typography="body2" style={base}>
        {title}
      </Text>
      <Text typography="body2" style={muted}>
        {description}
      </Text>
    </>
  );
}

function EventLine({ event }: Readonly<{ event: EventRow }>) {
  const { mono, mutedMono } = useToolStyles();

  return (
    <Disclosure
      label={
        <>
          <Text typography="body2" style={mutedMono}>
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
        </>
      }
      rows={event.payload}
    />
  );
}

function Disclosure({ label, rows }: Readonly<{ label: ReactNode; rows: readonly DisplayRow[] }>) {
  const [open, setOpen] = useState(false);
  const { muted, mono, mutedMono } = useToolStyles();

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
          {label}
        </Box>
      </Pressable>
      {open ? (
        <Box lx={LOG_LX} style={{ paddingLeft: 16 }}>
          {rows.length === 0 ? (
            <Text typography="body2" style={mutedMono}>
              —
            </Text>
          ) : (
            rows.map((row, index) => (
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
