import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceModelId as DmkDeviceModelId } from "@ledgerhq/device-management-kit";
import {
  deviceOnboardingMachine,
  type DeviceOnboardingPorts,
  type DeviceOnboardingSession,
  type OnboardingEvent,
  type OnboardingStep,
} from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { dmkToLedgerDeviceIdMap, activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { createActor, type ActorRefFrom } from "xstate";
import { createDeviceOnboardingPorts } from "../utils/ports";
import {
  flattenDeviceOnboardingContext,
  stateValueToString,
  toolEvent,
  type DeviceOnboardingToolProps,
  userEvents,
} from "../utils/toolState";
import { useFirmwareUpdateHandover } from "./useFirmwareUpdateHandover";

type OnboardingActor = ActorRefFrom<typeof deviceOnboardingMachine>;

function availableEvents(actor: OnboardingActor, sessionReady: boolean) {
  const candidates: OnboardingEvent[] = sessionReady
    ? [{ type: "SESSION_READY" }, ...userEvents]
    : [...userEvents];
  return candidates.filter(event => actor.getSnapshot().can(event)).map(event => ({ event }));
}

function ledgerDevice(
  deviceId: string,
  deviceName: string | null,
  modelId: DmkDeviceModelId,
): Device {
  return {
    deviceId,
    deviceName,
    modelId: dmkToLedgerDeviceIdMap[modelId],
    wired: true,
  };
}

export function useDeviceOnboarding(): DeviceOnboardingToolProps {
  const [status, setStatus] = useState<DeviceOnboardingToolProps["status"]>("idle");
  const [device, setDevice] = useState<DeviceOnboardingToolProps["device"]>(null);
  const [ledgerDeviceState, setLedgerDeviceState] = useState<Device | null>(null);
  const [state, setState] = useState<string | null>(null);
  const [context, setContext] = useState<DeviceOnboardingToolProps["context"]>(null);
  const [events, setEvents] = useState<DeviceOnboardingToolProps["events"]>([]);
  const [exit, setExit] = useState<DeviceOnboardingToolProps["exit"]>(null);
  const [sendableEvents, setSendableEvents] = useState<DeviceOnboardingToolProps["sendableEvents"]>(
    [],
  );
  const [error, setError] = useState<string | null>(null);

  const actorRef = useRef<OnboardingActor | null>(null);
  const portsRef = useRef<DeviceOnboardingPorts | null>(null);
  const eventSequence = useRef(0);
  const lastLoggedStep = useRef<OnboardingStep | null>(null);
  const sessionReadyRef = useRef(false);
  const transportLostRef = useRef(false);
  const adoptGeneration = useRef(0);

  const delegatedPorts = useRef<DeviceOnboardingPorts>({
    openSession: () => {
      if (!portsRef.current) throw new Error("No desktop onboarding session");
      return portsRef.current.openSession();
    },
    currentSessionId: () => {
      if (!portsRef.current) throw new Error("No desktop onboarding session");
      return portsRef.current.currentSessionId();
    },
    closeSession: () => portsRef.current?.closeSession() ?? Promise.resolve(),
  }).current;

  const appendEvent = useCallback((event: OnboardingEvent) => {
    if (event.type === "STEP_CHANGED") {
      const step = event.state.currentOnboardingStep;
      if (step === lastLoggedStep.current) return;
      lastLoggedStep.current = step;
    }

    const sessionId = portsRef.current?.currentSessionId() ?? "unavailable";
    const next = toolEvent(event, String(eventSequence.current++), sessionId);
    setEvents(current => [...current.slice(-49), next]);
  }, []);

  const sendToActor = useCallback((event: OnboardingEvent) => {
    const actor = actorRef.current;
    if (!actor) return;
    if (event.type === "SESSION_READY") sessionReadyRef.current = false;
    actor.send(event);
  }, []);

  const refreshSendable = useCallback((actor: OnboardingActor) => {
    setSendableEvents(availableEvents(actor, sessionReadyRef.current));
  }, []);

  const rememberDevice = useCallback((session: DeviceOnboardingSession) => {
    const connected = session.dmk.getConnectedDevice({ sessionId: session.sessionId });
    setLedgerDeviceState(ledgerDevice(connected.id, connected.name ?? null, session.deviceModelId));
    setDevice({
      name: connected.name ?? String(session.deviceModelId),
      modelId: String(session.deviceModelId),
      sessionId: portsRef.current?.currentSessionId() ?? session.sessionId,
      wired: true,
    });
  }, []);

  const adoptSession = useCallback(async () => {
    const generation = ++adoptGeneration.current;
    const recoveringFromLoss = transportLostRef.current;
    transportLostRef.current = false;
    const nextPorts = createDeviceOnboardingPorts();
    portsRef.current = nextPorts;

    try {
      const session = await nextPorts.openSession();
      if (generation !== adoptGeneration.current) {
        await nextPorts.closeSession();
        return;
      }

      rememberDevice(session);
      setError(null);

      if (actorRef.current) {
        sessionReadyRef.current = true;
        if (recoveringFromLoss && actorRef.current.getSnapshot().can({ type: "SESSION_READY" })) {
          sendToActor({ type: "SESSION_READY" });
        } else {
          refreshSendable(actorRef.current);
        }
        setStatus("running");
        return;
      }

      lastLoggedStep.current = null;
      const actor = createActor(deviceOnboardingMachine, {
        input: {
          dmk: session.dmk,
          ports: delegatedPorts,
          deviceId: session.dmk.getConnectedDevice({ sessionId: session.sessionId }).id,
          deviceModelId: session.deviceModelId,
          offerSync: false,
        },
        inspect: inspectionEvent => {
          if (inspectionEvent.type !== "@xstate.event") return;
          if (inspectionEvent.actorRef !== actorRef.current) return;
          if (inspectionEvent.event.type.startsWith("xstate.")) return;
          appendEvent(inspectionEvent.event as OnboardingEvent);
        },
      });
      actorRef.current = actor;
      actor.subscribe(snapshot => {
        setState(stateValueToString(snapshot.value));
        setContext(flattenDeviceOnboardingContext(snapshot.context));
        refreshSendable(actor);

        if (snapshot.status === "done") {
          const output = snapshot.output;
          setExit({
            reason: output.reason,
            sessionId: output.sessionId,
            modelId: String(output.device.modelId),
          });
          setStatus("exited");
          if (actorRef.current === actor) actorRef.current = null;
        }
      });
      actor.start();
      setStatus("running");
    } catch {
      await nextPorts.closeSession();
      if (generation !== adoptGeneration.current) return;
      if (recoveringFromLoss) transportLostRef.current = true;
      setError("Unable to start device onboarding");
      setStatus(actorRef.current ? "running" : "idle");
    }
  }, [appendEvent, delegatedPorts, refreshSendable, rememberDevice, sendToActor]);

  const connect = useCallback(() => {
    setError(null);
    setStatus("connecting");
    void adoptSession();
  }, [adoptSession]);

  const send = useCallback(
    (event: OnboardingEvent) => {
      const actor = actorRef.current;
      if (!actor?.getSnapshot().can(event)) return;
      sendToActor(event);
    },
    [sendToActor],
  );

  const reset = useCallback(() => {
    adoptGeneration.current += 1;
    actorRef.current?.stop();
    actorRef.current = null;
    void portsRef.current?.closeSession();
    portsRef.current = null;
    transportLostRef.current = false;
    sessionReadyRef.current = false;
    lastLoggedStep.current = null;
    setStatus("idle");
    setDevice(null);
    setLedgerDeviceState(null);
    setState(null);
    setContext(null);
    setEvents([]);
    setExit(null);
    setSendableEvents([]);
    setError(null);
  }, []);

  useEffect(() => {
    const subscription = activeDeviceSessionSubject.subscribe(session => {
      const actor = actorRef.current;
      if (!actor) return;

      if (!session) {
        transportLostRef.current = true;
        sessionReadyRef.current = false;
        setDevice(null);
        setLedgerDeviceState(null);
        if (actor.getSnapshot().can({ type: "TRANSPORT_LOST" })) {
          sendToActor({ type: "TRANSPORT_LOST" });
        }
        return;
      }

      if (!transportLostRef.current) return;
      transportLostRef.current = false;
      void (async () => {
        try {
          const opened = await portsRef.current?.openSession();
          if (opened) rememberDevice(opened);
          sessionReadyRef.current = true;
          if (actorRef.current?.getSnapshot().can({ type: "SESSION_READY" })) {
            sendToActor({ type: "SESSION_READY" });
          }
        } catch {
          transportLostRef.current = true;
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [rememberDevice, sendToActor]);

  useEffect(
    () => () => {
      adoptGeneration.current += 1;
      actorRef.current?.stop();
    },
    [],
  );

  useFirmwareUpdateHandover({
    device: ledgerDeviceState,
    machineState: state,
    send: sendToActor,
  });

  return {
    status,
    device,
    state,
    context,
    events,
    exit,
    sendableEvents,
    error,
    connect,
    send,
    reset,
  };
}
