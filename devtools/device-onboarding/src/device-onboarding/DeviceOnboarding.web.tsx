import { useState } from "react";
import { Button } from "@ledgerhq/lumen-ui-react";
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
} from "@ledgerhq/lumen-ui-react/symbols";
import type { DeviceOnboardingToolProps } from "../types";
import {
  useDeviceOnboardingViewModel,
  type DisplayRow,
  type EventRow,
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

function DeviceOnboarding(props: DeviceOnboardingToolProps) {
  const vm = useDeviceOnboardingViewModel(props);

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
              Connect
            </Button>
            <Button size="sm" appearance="transparent" disabled={!vm.canReset} onClick={vm.reset}>
              Reset
            </Button>
          </span>
        </div>
        {vm.deviceLabel ? <code className="text-muted">{vm.deviceLabel}</code> : null}
      </div>

      {vm.error ? (
        <div className="px-16 py-10 border-b border-base body-3 text-error">{vm.error}</div>
      ) : null}

      <div className="px-16 py-12 border-b border-base flex flex-col items-start gap-8">
        <div className="flex flex-wrap items-center gap-8">
          {vm.sendableRows.length === 0 ? (
            <span className="body-3 text-muted">No event accepted in this state</span>
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
          <PossibleNext rows={vm.nextStates} />
          {vm.logLines.length === 0 ? (
            <code className="text-muted">—</code>
          ) : (
            vm.logLines.map(line =>
              line.line === "state" ? (
                <StateChip key={line.key} step={line} />
              ) : (
                <EventLine key={line.id} event={line} />
              ),
            )
          )}
        </div>
      </div>

      {vm.exitRows.length > 0 ? <Rows title="Exit" rows={vm.exitRows} /> : null}
      {vm.contextRows.length > 0 ? <Rows title="Context" rows={vm.contextRows} /> : null}
    </div>
  );
}

function PossibleNext({ rows }: Readonly<{ rows: DeviceOnboardingToolProps["nextStates"] }>) {
  if (rows.length === 0) return null;

  return (
    <div className="flex flex-col items-start gap-4 p-8 rounded-sm border border-dashed border-base opacity-60">
      <span className="body-3 text-muted">Possible</span>
      {rows.map(row => (
        <code key={`${row.event}-${row.state}`} className="text-muted">
          {row.event} → {row.state}
        </code>
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

function Rows({ title, rows }: Readonly<{ title: string; rows: readonly DisplayRow[] }>) {
  return (
    <div className="px-16 py-12 border-b border-base flex flex-col gap-4">
      <span className="body-3 text-muted">{title}</span>
      {rows.map(row => (
        <span key={row.label} className="flex items-baseline gap-8 body-3">
          <span className="text-muted shrink-0">{row.label}</span>
          <code className="text-base break-all">{row.value}</code>
        </span>
      ))}
    </div>
  );
}

function EventLine({ event }: Readonly<{ event: EventRow }>) {
  const [open, setOpen] = useState(false);

  return (
    <span className="flex flex-col items-start gap-4">
      <button
        type="button"
        className="flex items-baseline gap-8 body-3 bg-transparent border-0 p-0 text-left"
        onClick={() => setOpen(current => !current)}
      >
        <code className="text-muted shrink-0">{event.time}</code>
        <code className="text-base shrink-0">{event.type}</code>
        {event.detail ? <code className="text-muted truncate min-w-0">{event.detail}</code> : null}
      </button>
      {open ? (
        <span className="flex flex-col items-start gap-4 pl-16">
          {event.payload.length === 0 ? (
            <code className="text-muted">—</code>
          ) : (
            event.payload.map(row => (
              <span key={row.label} className="flex items-baseline gap-8 body-3">
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
