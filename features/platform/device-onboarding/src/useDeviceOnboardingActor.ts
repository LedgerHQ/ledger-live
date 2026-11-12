import { useCallback, useMemo, useRef, useState } from "react";
import { createActor, waitFor, type ActorRefFrom, type InspectionEvent } from "xstate";
import {
  flattenDeviceOnboardingContext,
  stampSession,
  stateValueToString,
  userEvents,
  type HostOnboardingEvent,
  type SendableOnboardingEvent,
} from "./host";
import { deviceOnboardingMachine } from "./machine";
import type { DeviceOnboardingPorts } from "./ports";
import type {
  DeviceOnboardingContext,
  DeviceOnboardingExitReason,
  DeviceOnboardingInput,
  DeviceOnboardingOutput,
  OnboardingEvent,
} from "./types";

export type OnboardingActor = ActorRefFrom<typeof deviceOnboardingMachine>;

export type OnboardingActorSnapshot = ReturnType<OnboardingActor["getSnapshot"]>;

/** What the machine's inspection reports: every actor update, child actors included. */
export type OnboardingInspectionEvent = InspectionEvent;

export type StartOnboardingActorInput = Pick<
  DeviceOnboardingInput,
  "dmk" | "deviceId" | "deviceModelId" | "offerSync" | "hostsSeedSetup"
>;

export type UseDeviceOnboardingActorOptions = {
  missingSessionMessage: string;
  onSnapshot?: (next: OnboardingActorSnapshot, previous: OnboardingActorSnapshot | null) => void;
  onDone?: (output: DeviceOnboardingOutput) => void;
  onEvent?: (event: OnboardingEvent) => void;
  /**
   * Runs once, when the machine enters a final state. The context is the one this transition
   * produced: the published snapshot can still be the previous one.
   */
  leaveOnboarding?: (reason: DeviceOnboardingExitReason, context: DeviceOnboardingContext) => void;
  /** Handed to `createActor` as is, so an observer sees every update from the actor's creation. */
  inspect?: (event: OnboardingInspectionEvent) => void;
};

function availableEvents(
  snapshot: OnboardingActorSnapshot,
  sessionReady: boolean,
  sessionId: () => string,
): SendableOnboardingEvent[] {
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
  inspect,
}: UseDeviceOnboardingActorOptions) {
  const [snapshot, setSnapshot] = useState<OnboardingActorSnapshot | null>(null);
  const [sessionReady, setSessionReady] = useState(false);
  const [exit, setExit] = useState<{
    reason: DeviceOnboardingOutput["reason"];
    sessionId: string;
    modelId: string;
  } | null>(null);

  const actorRef = useRef<OnboardingActor | null>(null);
  const portsRef = useRef<DeviceOnboardingPorts | null>(null);
  const previousSnapshotRef = useRef<OnboardingActorSnapshot | null>(null);
  const onSnapshotRef = useRef(onSnapshot);
  const onDoneRef = useRef(onDone);
  const onEventRef = useRef(onEvent);
  const leaveOnboardingRef = useRef(leaveOnboarding);
  const inspectRef = useRef(inspect);
  onSnapshotRef.current = onSnapshot;
  onDoneRef.current = onDone;
  onEventRef.current = onEvent;
  leaveOnboardingRef.current = leaveOnboarding;
  inspectRef.current = inspect;

  // The machine holds the session as data. The host is the one place that reads the live one.
  const currentSessionId = useCallback(() => {
    const ports = portsRef.current;
    if (!ports) throw new Error(missingSessionMessage);
    return ports.currentSessionId();
  }, [missingSessionMessage]);

  const state = snapshot ? stateValueToString(snapshot.value) : null;
  /** @deprecated Read the machine context. Kept while app code still reads these flat names. */
  const context = useMemo(
    () => (snapshot ? flattenDeviceOnboardingContext(snapshot) : null),
    [snapshot],
  );
  const sendableEvents = snapshot ? availableEvents(snapshot, sessionReady, currentSessionId) : [];

  const sendToActor = useCallback(
    (event: HostOnboardingEvent) => {
      const actor = actorRef.current;
      if (!actor) return;
      if (event.type === "SESSION_READY") setSessionReady(false);
      actor.send(stampSession(event, currentSessionId));
    },
    [currentSessionId],
  );

  /** Returns false when the machine cannot take the event now (for example while locked). */
  const send = useCallback(
    (event: HostOnboardingEvent): boolean => {
      const actor = actorRef.current;
      if (!actor?.getSnapshot().can(stampSession(event, currentSessionId))) return false;
      sendToActor(event);
      return true;
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
    setSnapshot(null);
    setExit(null);
    setSessionReady(false);
  }, [stopActor]);

  /** Quits the run like the user would, so the device leaves its screens, then clears the state. */
  const resetActor = useCallback(async () => {
    const current = actorRef.current;
    actorRef.current = null;
    if (current) {
      current.send({ type: "QUIT" });
      await waitFor(current, s => s.status === "done", { timeout: 3_000 }).catch(() => {});
      current.stop();
    }
    previousSnapshotRef.current = null;
    setSnapshot(null);
    setSessionReady(false);
    setExit(null);
  }, []);

  const startActor = useCallback(
    (input: StartOnboardingActorInput, hooks?: { beforeStart?: () => void }) => {
      previousSnapshotRef.current = null;
      setSessionReady(false);
      setExit(null);
      // The last update reaches inspection after `actorRef` is cleared, so the run keeps its own.
      const run: { actor: OnboardingActor | null } = { actor: null };
      const machine = deviceOnboardingMachine.provide({
        actions: {
          // A released run quits for the device only: the host stays where it is.
          leaveOnboarding: ({ context }, params) => {
            if (actorRef.current !== run.actor) return;
            leaveOnboardingRef.current?.(params.reason, context);
          },
        },
      });
      const actor = createActor(machine, {
        input: {
          dmk: input.dmk,
          sessionId: currentSessionId(),
          deviceId: input.deviceId,
          deviceModelId: input.deviceModelId,
          offerSync: input.offerSync,
          hostsSeedSetup: input.hostsSeedSetup,
        },
        // Each snapshot update carries the event that led to it, including the ones child
        // actors send back.
        inspect: inspectionEvent => {
          // An observer must never break the run it watches.
          try {
            inspectRef.current?.(inspectionEvent);
          } catch {
            // Nothing to do: the machine goes on without this observer.
          }
          if (inspectionEvent.type !== "@xstate.snapshot") return;
          if (inspectionEvent.actorRef !== run.actor) return;
          if (!("value" in inspectionEvent.snapshot)) return;
          if (inspectionEvent.event.type.startsWith("xstate.")) return;
          // A discarded run still reports to its observer, but the host only hears the current run.
          if (actorRef.current === run.actor) {
            onEventRef.current?.(inspectionEvent.event as OnboardingEvent);
          }
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
    [currentSessionId],
  );

  return {
    state,
    context,
    snapshot,
    exit,
    sendableEvents,
    sessionReady,
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

export type DeviceOnboardingActorSession = ReturnType<typeof useDeviceOnboardingActor>;
