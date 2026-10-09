import { Fragment, useState, type ReactNode } from "react";
import { Button, SegmentedControl, SegmentedControlButton, Switch } from "@ledgerhq/lumen-ui-react";
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
} from "@ledgerhq/lumen-ui-react/symbols";
import type { DeviceOnboardingToolProps } from "../types";
import {
  emptyLogCopy,
  headerCopy,
  featureFlagCopy,
  logCopy,
  openNextScreenCopy,
  overrideCopy,
} from "./configCopy";
import {
  useDeviceOnboardingViewModel,
  type DeviceOnboardingViewModel,
  type DisplayRow,
  type EventRow,
  type NextStateGroup,
  type StateKind,
  type StateStep,
} from "./useDeviceOnboardingViewModel";

// IconProps is not exported from @ledgerhq/lumen-ui-react, so the type comes from a symbol.
type IconComponent = typeof ShieldCheck;

const stepPresentation: Record<StateKind, { readonly Icon: IconComponent; readonly tone: string }> =
  {
    progress: { Icon: Circles, tone: "bg-muted-transparent text-muted" },
    genuine: { Icon: ShieldCheck, tone: "bg-active-subtle text-active" },
    firmware: { Icon: Download, tone: "bg-active-subtle text-active" },
    setup: { Icon: Nano, tone: "bg-active-subtle text-active" },
    locked: { Icon: Lock, tone: "bg-warning-transparent text-warning" },
    session: { Icon: Bluetooth, tone: "bg-warning-transparent text-warning" },
    failed: { Icon: Warning, tone: "bg-error-transparent text-error" },
    succeeded: { Icon: CheckmarkCircle, tone: "bg-success-transparent text-success" },
    quit: { Icon: ExitLogout, tone: "bg-muted-transparent text-muted" },
  };

function exportLogs(content: string) {
  const link = document.createElement("a");
  link.href = `data:application/json;charset=utf-8,${encodeURIComponent(content)}`;
  link.download = "device-onboarding-logs.json";
  link.click();
}

function DeviceOnboarding(props: DeviceOnboardingToolProps) {
  const vm = useDeviceOnboardingViewModel(props);
  const [tab, setTab] = useState<"log" | "config">("log");

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="px-16 py-10 border-b border-base flex flex-col gap-8 body-3">
        <div className="flex items-center gap-8">
          <span
            className={`w-8 h-8 rounded-full inline-block ${
              vm.isRunning ? "bg-success" : "bg-muted"
            }`}
          />
          <span className="text-base">{vm.statusLabel}</span>
          <span className="ml-auto flex items-center gap-4">
            <Button size="sm" appearance="accent" disabled={!vm.canConnect} onClick={vm.connect}>
              {headerCopy.connect}
            </Button>
            <Button size="sm" appearance="transparent" disabled={!vm.canReset} onClick={vm.reset}>
              {headerCopy.reset}
            </Button>
          </span>
        </div>
        {vm.deviceLabel ? <code className="text-muted">{vm.deviceLabel}</code> : null}
        {vm.contextRows.length > 0 ? (
          <Disclosure
            label={<span className="text-muted">{logCopy.context}</span>}
            rows={vm.contextRows}
          />
        ) : null}
        <SegmentedControl
          selectedValue={tab}
          onSelectedChange={setTab}
          aria-label={headerCopy.tabs}
        >
          <SegmentedControlButton value="log">{headerCopy.log}</SegmentedControlButton>
          <SegmentedControlButton value="config">{headerCopy.config}</SegmentedControlButton>
        </SegmentedControl>
      </div>

      {vm.error ? (
        <div className="px-16 py-10 border-b border-base body-3 text-error">{vm.error}</div>
      ) : null}

      {tab === "config" ? <ConfigTab vm={vm} /> : <LogTab vm={vm} />}
    </div>
  );
}

function ConfigTab({ vm }: Readonly<{ vm: DeviceOnboardingViewModel }>) {
  return (
    <div className="flex flex-col">
      <OverrideSection vm={vm} />
      {vm.featureFlagRows.length > 0 ? <FeatureFlagSection rows={vm.featureFlagRows} /> : null}
      {vm.setShowNextScreen ? (
        <div className="px-16 py-12 border-b border-base flex items-center gap-8">
          <SectionHeader {...openNextScreenCopy} />
          <Switch
            selected={vm.showNextScreen}
            onChange={vm.setShowNextScreen}
            aria-label={openNextScreenCopy.title}
            className="ml-auto"
          />
        </div>
      ) : null}
    </div>
  );
}

function LogTab({ vm }: Readonly<{ vm: DeviceOnboardingViewModel }>) {
  if (vm.logIsEmpty) {
    return (
      <div className="px-16 py-12 border-b border-base">
        <SectionHeader {...emptyLogCopy} />
      </div>
    );
  }

  return (
    <div className="px-16 py-12 border-b border-base flex flex-col items-start gap-8">
      <div className="flex flex-wrap items-center gap-8">
        {vm.sendableRows.length === 0 ? (
          <span className="body-3 text-muted">{logCopy.noEvent}</span>
        ) : (
          vm.sendableRows.map(row => (
            <Button
              key={row.key}
              size="sm"
              appearance="transparent"
              disabled={!vm.canSend}
              onClick={() => vm.send(row.event)}
            >
              {row.label}
            </Button>
          ))
        )}
      </div>
      <div className="mt-16 flex flex-col items-start gap-4">
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
      </div>
      <Button size="sm" appearance="transparent" onClick={() => exportLogs(vm.exportLogs())}>
        {logCopy.export}
      </Button>
    </div>
  );
}

function FeatureFlagSection({
  rows,
}: Readonly<{ rows: DeviceOnboardingViewModel["featureFlagRows"] }>) {
  return (
    <div className="px-16 py-12 border-b border-base flex flex-col gap-12">
      <SectionHeader {...featureFlagCopy} />
      {rows.map(row => (
        <div key={row.key} className="flex items-center gap-8">
          <span className="body-3 text-base">{row.label}</span>
          <Switch
            selected={row.checked}
            onChange={row.onChange}
            aria-label={row.label}
            className="ml-auto"
          />
        </div>
      ))}
    </div>
  );
}

function OverrideSection({ vm }: Readonly<{ vm: DeviceOnboardingViewModel }>) {
  return (
    <div className="px-16 py-12 border-b border-base flex flex-col gap-12">
      <SectionHeader title={overrideCopy.title} description={overrideCopy.description} />
      {vm.overrideRows.map(row => (
        <OverrideRow key={row.key} label={row.label}>
          <SegmentedControl
            selectedValue={row.value}
            onSelectedChange={row.onChange}
            aria-label={row.label}
          >
            {row.options.map(option => (
              <SegmentedControlButton key={option.value} value={option.value}>
                {option.label}
              </SegmentedControlButton>
            ))}
          </SegmentedControl>
        </OverrideRow>
      ))}
    </div>
  );
}

function OverrideRow({ label, children }: Readonly<{ label: string; children: ReactNode }>) {
  return (
    <span className="flex flex-col items-start gap-8">
      <span className="body-3 text-base">{label}</span>
      {children}
    </span>
  );
}

function PossibleEvents({ groups }: Readonly<{ groups: readonly NextStateGroup[] }>) {
  if (groups.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-4 pl-16 opacity-60">
      {groups.map(group => (
        <div key={group.event} className="flex flex-col items-start gap-4">
          <code className="text-muted">{group.event}</code>
          {group.states.map((state, index) => (
            <code key={`${index}-${state}`} className="text-muted pl-16">
              {state}
            </code>
          ))}
        </div>
      ))}
    </div>
  );
}

function StateChip({ step }: Readonly<{ step: StateStep }>) {
  const { Icon, tone } = stepPresentation[step.kind];

  return (
    <span
      className={`flex items-center gap-8 px-8 py-4 rounded-sm body-3 border ${tone} ${
        step.isCurrent ? "border-current" : "border-transparent"
      }`}
    >
      <Icon size={16} />
      <code>{step.label}</code>
    </span>
  );
}

function SectionHeader({ title, description }: Readonly<{ title: string; description: string }>) {
  return (
    <span className="flex flex-col gap-4">
      <span className="body-3 text-base">{title}</span>
      <span className="body-3 text-muted">{description}</span>
    </span>
  );
}

function EventLine({ event }: Readonly<{ event: EventRow }>) {
  return (
    <Disclosure
      label={
        <>
          <code className="text-muted shrink-0">{event.time}</code>
          <code className="text-base shrink-0">{event.type}</code>
          {event.detail ? (
            <code className="text-muted truncate min-w-0">{event.detail}</code>
          ) : null}
        </>
      }
      rows={event.payload}
    />
  );
}

function Disclosure({ label, rows }: Readonly<{ label: ReactNode; rows: readonly DisplayRow[] }>) {
  const [open, setOpen] = useState(false);

  return (
    <span className="flex flex-col items-start gap-4">
      <button
        type="button"
        className="flex items-center gap-8 body-3 bg-transparent border-0 p-0 text-left"
        aria-expanded={open}
        onClick={() => setOpen(current => !current)}
      >
        {open ? (
          <ChevronDown size={16} className="text-muted shrink-0" />
        ) : (
          <ChevronRight size={16} className="text-muted shrink-0" />
        )}
        {label}
      </button>
      {open ? (
        <span className="flex flex-col items-start gap-4 pl-16">
          {rows.length === 0 ? (
            <code className="text-muted">—</code>
          ) : (
            rows.map((row, index) => (
              <span key={`${index}-${row.label}`} className="flex items-baseline gap-8 body-3">
                <span className="text-muted shrink-0">{row.label}</span>
                <code className="text-base break-all">{row.value}</code>
              </span>
            ))
          )}
        </span>
      ) : null}
    </span>
  );
}

export default DeviceOnboarding;
