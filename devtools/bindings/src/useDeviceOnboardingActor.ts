import { useCallback, useRef, useState } from "react";
import {
  createOnboardingEventLog,
  deviceOnboardingMachine,
  flattenDeviceOnboardingContext,
  nextStatesFrom,
  stampSession,
  stateValueToString,
  userEvents,
  type DeviceOnboardingInput,
  type DeviceOnboardingExitReason,
  type DeviceOnboardingOutput,
  type DeviceOnboardingPorts,
  type HostLogRow,
  type HostOnboardingEvent,
  type OnboardingEvent,
} from "@ledgerhq/device-onboarding";
import { createActor, type ActorRefFrom } from "xstate";

type OnboardingActor = ActorRefFrom<typeof deviceOnboardingMachine>;

export type OnboardingActorSnapshot = ReturnType<OnboardingActor["getSnapshot"]>;

type StartOnboardingActorInput = Pick<
  DeviceOnboardingInput,
  "dmk" | "deviceId" | "deviceModelId" | "offerSync"
>;

type UseDeviceOnboardingActorOptions = {
  missingSessionMessage: string;
  onSnapshot?: (next: OnboardingActorSnapshot, previous: OnboardingActorSnapshot | null) => void;
  onDone?: (output: DeviceOnboardingOutput) => void;
  onEvent?: (event: OnboardingEvent) => void;
  /** Runs once, when the machine enters a final state. The app's exit effects go here. */
  leaveOnboarding?: (reason: DeviceOnboardingExitReason) => void;
};

function availableEvents(
  snapshot: OnboardingActorSnapshot,
  sessionReady: boolean,
  sessionId: () => string,
) {
  const candidates: HostOnboardingEvent[] = sessionReady
    ? [{ type: "SESSION_READY" }, ...userEvents]
    : [...userEvents];
  return candidates
    .filter(event => snapshot.can(stampSession(event, sessionId)))
    .map(event => ({ event }));
}

export function useDeviceOnboardingActor({
  missingSessionMessage,
  onSnapshot,
  onDone,
  onEvent,
  leaveOnboarding,
}: UseDeviceOnboardingActorOptions) {
  const [snapshot, setSnapshot] = useState<OnboardingActorSnapshot | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [log, setLog] = useState<HostLogRow[]>([]);
  const [exit, setExit] = useState<{
    reason: DeviceOnboardingOutput["reason"];
    sessionId: string;
    modelId: string;
  } | null>(null);

  const actorRef = useRef<OnboardingActor | null>(null);
  const portsRef = useRef<DeviceOnboardingPorts | null>(null);
  const eventSequence = useRef(0);
  const lastLoggedStep = useRef<string | null>(null);
  const previousSnapshotRef = useRef<OnboardingActorSnapshot | null>(null);
  const onSnapshotRef = useRef(onSnapshot);
  const onDoneRef = useRef(onDone);
  const onEventRef = useRef(onEvent);
  const leaveOnboardingRef = useRef(leaveOnboarding);
  onSnapshotRef.current = onSnapshot;
  onDoneRef.current = onDone;
  onEventRef.current = onEvent;
  leaveOnboardingRef.current = leaveOnboarding;

  // The machine holds the session as data. The host is the one place that reads the live one.
  const currentSessionId = useCallback(() => {
    const ports = portsRef.current;
    if (!ports) throw new Error(missingSessionMessage);
    return ports.currentSessionId();
  }, [missingSessionMessage]);

  const state = snapshot ? stateValueToString(snapshot.value) : null;
  const context = snapshot ? flattenDeviceOnboardingContext(snapshot.context) : null;
  const sendableEvents = snapshot ? availableEvents(snapshot, sessionReady, currentSessionId) : [];
  const nextStates = nextStatesFrom(snapshot);

  const rememberState = useCallback((state: string) => {
    setLog(current => (current.at(-1)?.state === state ? current : [...current, { state }]));
  }, []);

  // A STEP_CHANGED that repeats the logged step still moves the state, so the state is kept.
  const appendEvent = useCallback(
    (state: string, event: OnboardingEvent) => {
      let logged = false;
      createOnboardingEventLog({
        currentSessionId: () => portsRef.current?.currentSessionId(),
        lastLoggedStep,
        sequence: eventSequence,
        push: entry => {
          logged = true;
          setLog(current => [...current, { state, event: entry }]);
        },
      })(event);
      if (!logged) rememberState(state);
    },
    [rememberState],
  );

  const sendToActor = useCallback(
    (event: HostOnboardingEvent) => {
      const actor = actorRef.current;
      if (!actor) return;
      if (event.type === "SESSION_READY") setSessionReady(false);
      actor.send(stampSession(event, currentSessionId));
    },
    [currentSessionId],
  );

  const send = useCallback(
    (event: HostOnboardingEvent) => {
      const actor = actorRef.current;
      if (!actor?.getSnapshot().can(stampSession(event, currentSessionId))) return;
      sendToActor(event);
    },
    [currentSessionId, sendToActor],
  );

  const stopActor = useCallback(() => {
    const current = actorRef.current;
    actorRef.current = null;
    current?.stop();
  }, []);

  const discardActor = useCallback(() => {
    stopActor();
    previousSnapshotRef.current = null;
    setLog([]);
    setExit(null);
    setSessionReady(false);
  }, [stopActor]);

  const resetActor = useCallback(() => {
    stopActor();
    previousSnapshotRef.current = null;
    lastLoggedStep.current = null;
    setSnapshot(null);
    setSessionReady(false);
    setLog([]);
    setExit(null);
  }, [stopActor]);

  const startActor = useCallback(
    (input: StartOnboardingActorInput, hooks?: { beforeStart?: () => void }) => {
      lastLoggedStep.current = null;
      previousSnapshotRef.current = null;
      setSessionReady(false);
      setLog([]);
      setExit(null);
      // The last update reaches inspection after `actorRef` is cleared, so the run keeps its own.
      const run: { actor: OnboardingActor | null } = { actor: null };
      const machine = deviceOnboardingMachine.provide({
        actions: {
          leaveOnboarding: (_, params) => leaveOnboardingRef.current?.(params.reason),
        },
      });
      const actor = createActor(machine, {
        input: {
          dmk: input.dmk,
          sessionId: currentSessionId(),
          deviceId: input.deviceId,
          deviceModelId: input.deviceModelId,
          offerSync: input.offerSync,
        },
        // Each snapshot update carries the event that led to it, including the ones child
        // actors send back. The log keeps both, so a row shows where the event took the machine.
        inspect: inspectionEvent => {
          if (inspectionEvent.type !== "@xstate.snapshot") return;
          if (inspectionEvent.actorRef !== run.actor) return;
          if (!("value" in inspectionEvent.snapshot)) return;
          const state = stateValueToString(inspectionEvent.snapshot.value);
          if (inspectionEvent.event.type.startsWith("xstate.")) {
            rememberState(state);
            return;
          }
          const event = inspectionEvent.event as OnboardingEvent;
          appendEvent(state, event);
          // A discarded run still finishes its log, but the host only hears the current run.
          if (actorRef.current === run.actor) onEventRef.current?.(event);
        },
      });
      run.actor = actor;
      actorRef.current = actor;
      actor.subscribe(nextSnapshot => {
        if (actorRef.current !== actor) return;
        const previous = previousSnapshotRef.current;
        previousSnapshotRef.current = nextSnapshot;
        onSnapshotRef.current?.(nextSnapshot, previous);
        setSnapshot(nextSnapshot);

        if (nextSnapshot.status === "done") {
          const output = nextSnapshot.output;
          setExit({
            reason: output.reason,
            sessionId: output.sessionId,
            modelId: String(output.device.modelId),
          });
          onDoneRef.current?.(output);
          if (actorRef.current === actor) actorRef.current = null;
        }
      });
      hooks?.beforeStart?.();
      actor.start();
    },
    [appendEvent, currentSessionId, rememberState],
  );

  return {
    state,
    context,
    log,
    exit,
    sendableEvents,
    nextStates,
    setSessionReady,
    actorRef,
    portsRef,
    send,
    sendToActor,
    startActor,
    discardActor,
    resetActor,
    stopActor,
  };
}
