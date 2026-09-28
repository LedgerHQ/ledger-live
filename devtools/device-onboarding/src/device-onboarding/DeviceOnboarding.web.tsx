import { Button } from "@ledgerhq/lumen-ui-react";
import type { DeviceOnboardingToolProps } from "../types";
import {
  useDeviceOnboardingViewModel,
  type DisplayRow,
  type EventRow,
} from "./useDeviceOnboardingViewModel";

function DeviceOnboarding(props: DeviceOnboardingToolProps) {
  const vm = useDeviceOnboardingViewModel(props);

  return (
    <div className="flex flex-col overflow-y-auto">
      <div className="px-16 py-10 border-b border-base flex items-center gap-8 body-3">
        <span
          className={`w-8 h-8 rounded-full inline-block ${
            vm.isRunning ? "bg-success" : "bg-muted"
          }`}
        />
        <span className="text-base">{vm.statusLabel}</span>
        {vm.deviceLabel ? (
          <code className="text-muted truncate min-w-0">{vm.deviceLabel}</code>
        ) : null}
        <span className="ml-auto flex items-center gap-4">
          <Button size="sm" appearance="accent" disabled={!vm.canConnect} onClick={vm.connect}>
            Connect
          </Button>
          <Button size="sm" appearance="transparent" disabled={!vm.canReset} onClick={vm.reset}>
            Reset
          </Button>
        </span>
      </div>

      {vm.error ? (
        <div className="px-16 py-10 border-b border-base body-3 text-error">{vm.error}</div>
      ) : null}

      <div className="px-16 py-12 border-b border-base flex flex-col gap-4">
        <span className="body-3 text-muted">State</span>
        <code className="text-base break-all">{vm.stateLabel}</code>
      </div>

      <div className="px-16 py-12 border-b border-base flex flex-wrap items-center gap-8">
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

      {vm.exitRows.length > 0 ? <Rows title="Exit" rows={vm.exitRows} /> : null}
      {vm.contextRows.length > 0 ? <Rows title="Context" rows={vm.contextRows} /> : null}

      <div className="px-16 py-12 flex flex-col gap-4">
        <span className="body-3 text-muted">Events</span>
        {vm.eventRows.length === 0 ? (
          <span className="body-3 text-muted">Nothing yet</span>
        ) : (
          vm.eventRows.map(event => <EventLine key={event.id} event={event} />)
        )}
      </div>
    </div>
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
  return (
    <span className="flex items-baseline gap-8 body-3">
      <code className="text-muted shrink-0">{event.time}</code>
      <code className="text-base shrink-0">{event.type}</code>
      {event.detail ? <code className="text-muted truncate min-w-0">{event.detail}</code> : null}
    </span>
  );
}

export default DeviceOnboarding;
