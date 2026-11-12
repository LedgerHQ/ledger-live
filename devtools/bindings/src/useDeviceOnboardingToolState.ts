import { useCallback, useMemo, useRef, useState, type RefObject } from "react";
import {
  createOnboardingEventLog,
  nextStatesFrom,
  stateValueToString,
  toolContext,
  type DeviceOnboardingPorts,
  type HostLogRow,
  type HostToolEvent,
  type OnboardingActorSnapshot,
  type OnboardingEvent,
  type OnboardingInspectionEvent,
} from "@features/platform-device-onboarding";

export type UseDeviceOnboardingToolStateInput = {
  /** The product hook's snapshot: set while its run is current, null once reset or discarded. */
  snapshot: OnboardingActorSnapshot | null;
  portsRef: RefObject<DeviceOnboardingPorts | null>;
};

/**
 * The log keeps the newest rows only. A long run (lock loops, reconnects) must not grow without end,
 * and the export goes through the phone's share sheet, which has a size limit.
 */
const maxLogRows = 200;

const noRows: readonly HostLogRow[] = [];

function isRootActor(inspectionEvent: OnboardingInspectionEvent): boolean {
  return inspectionEvent.actorRef.sessionId === inspectionEvent.rootId;
}

/**
 * The device onboarding devtool's view of a run. Pass `inspect` to the product hook: the log is
 * recorded from the actor's creation, and restarts with each new run.
 */
export function useDeviceOnboardingToolState({
  snapshot,
  portsRef,
}: UseDeviceOnboardingToolStateInput) {
  const [rows, setRows] = useState<HostLogRow[]>([]);
  const eventSequence = useRef(0);
  const lastLoggedStep = useRef<string | null>(null);

  // One row per machine update. An internal xstate event, or a STEP_CHANGED that repeats the
  // logged step, adds no event: the row then only marks a new state.
  const logUpdate = useCallback(
    (state: string, event: OnboardingEvent | null) => {
      const entries: HostToolEvent[] = [];
      if (event) {
        createOnboardingEventLog({
          currentSessionId: () => portsRef.current?.currentSessionId(),
          lastLoggedStep,
          sequence: eventSequence,
          push: entry => entries.push(entry),
        })(event);
      }
      const [entry] = entries;
      setRows(current => {
        if (entry) return [...current.slice(1 - maxLogRows), { state, event: entry }];
        if (current.at(-1)?.state === state) return current;
        return [...current.slice(1 - maxLogRows), { state }];
      });
    },
    [portsRef],
  );

  const inspect = useCallback(
    (inspectionEvent: OnboardingInspectionEvent) => {
      if (!isRootActor(inspectionEvent)) return;
      if (inspectionEvent.type === "@xstate.actor") {
        lastLoggedStep.current = null;
        setRows([]);
        return;
      }
      // Each snapshot update carries the event that led to it, including the ones child actors
      // send back. The log keeps both, so a row shows where the event took the machine.
      if (inspectionEvent.type !== "@xstate.snapshot") return;
      if (!("value" in inspectionEvent.snapshot)) return;
      const event = inspectionEvent.event.type.startsWith("xstate.")
        ? null
        : (inspectionEvent.event as OnboardingEvent);
      logUpdate(stateValueToString(inspectionEvent.snapshot.value), event);
    },
    [logUpdate],
  );

  // Copies and walks of the machine: once per update, not on every render of the host.
  const machineContext = useMemo(
    () => (snapshot ? toolContext(snapshot.context) : null),
    [snapshot],
  );
  const nextStates = useMemo(() => nextStatesFrom(snapshot), [snapshot]);
  // A reset or discarded run clears the snapshot, and the log with it.
  const log = snapshot ? rows : noRows;

  return { log, machineContext, nextStates, inspect };
}

export type DeviceOnboardingToolState = ReturnType<typeof useDeviceOnboardingToolState>;
