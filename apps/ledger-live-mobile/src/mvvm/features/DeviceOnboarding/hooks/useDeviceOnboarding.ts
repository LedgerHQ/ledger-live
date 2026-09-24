import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  deviceOnboardingMachine,
  type DeviceOnboardingPorts,
  type OnboardingEvent,
  type OnboardingStep,
  type SessionEvent,
} from "@ledgerhq/device-onboarding";
import {
  connectDevice,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import type { DeviceConnectionResult, KnownDevice } from "@ledgerhq/live-dmk-shared";
import { createActor, type ActorRefFrom } from "xstate";
import type { Subscription } from "rxjs";
import { createDeviceOnboardingPorts } from "../utils/ports";
import { createSessionEventsActor } from "../utils/sessionEvents";
import {
  flattenDeviceOnboardingContext,
  stateValueToString,
  toolEvent,
  type DeviceOnboardingToolProps,
  userEvents,
} from "../utils/toolState";

type UseDeviceOnboardingInput = {
  dmk: DeviceManagementKit | null;
  knownDevices: KnownDevice[];
  offerSync: boolean;
};

type OnboardingActor = ActorRefFrom<typeof deviceOnboardingMachine>;
type StoppableActor = { stop(): void };

function availableEvents(actor: OnboardingActor, sessionReady: boolean) {
  const candidates: OnboardingEvent[] = sessionReady
    ? [{ type: "SESSION_READY" }, ...userEvents]
    : [...userEvents];
  return candidates.filter(event => actor.getSnapshot().can(event)).map(event => ({ event }));
}

export function useDeviceOnboarding({
  dmk,
  knownDevices,
  offerSync,
}: UseDeviceOnboardingInput): DeviceOnboardingToolProps {
  const [status, setStatus] = useState<DeviceOnboardingToolProps["status"]>("idle");
  const [device, setDevice] = useState<DeviceOnboardingToolProps["device"]>(null);
  const [state, setState] = useState<string | null>(null);
  const [context, setContext] = useState<DeviceOnboardingToolProps["context"]>(null);
  const [events, setEvents] = useState<DeviceOnboardingToolProps["events"]>([]);
  const [exit, setExit] = useState<DeviceOnboardingToolProps["exit"]>(null);
  const [sendableEvents, setSendableEvents] = useState<
    DeviceOnboardingToolProps["sendableEvents"]
  >([]);
  const [error, setError] = useState<string | null>(null);

  const actorRef = useRef<OnboardingActor | null>(null);
  const portsRef = useRef<DeviceOnboardingPorts | null>(null);
  const sessionActorRef = useRef<StoppableActor | null>(null);
  const connectionRef = useRef<Subscription | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const eventSequence = useRef(0);
  const lastLoggedStep = useRef<OnboardingStep | null>(null);
  const selectedDevices = useRef(new Set<string>());
  const sessionReadyRef = useRef(false);

  const delegatedPorts = useRef<DeviceOnboardingPorts>({
    openSession: () => {
      if (!portsRef.current) throw new Error("No mobile onboarding session");
      return portsRef.current.openSession();
    },
    currentSessionId: () => {
      if (!portsRef.current) throw new Error("No mobile onboarding session");
      return portsRef.current.currentSessionId();
    },
    closeSession: () => portsRef.current?.closeSession() ?? Promise.resolve(),
  }).current;

  const dropLostTransport = useCallback(() => {
    sessionReadyRef.current = false;
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
    setDevice(null);
  }, []);

  const appendEvent = useCallback((event: OnboardingEvent) => {
    if (event.type === "STEP_CHANGED") {
      // Polling re-emits on every seed word, so logging each one would count them on screen.
      const step = event.state.currentOnboardingStep;
      if (step === lastLoggedStep.current) return;
      lastLoggedStep.current = step;
    }

    const sessionId = portsRef.current?.currentSessionId() ?? "unavailable";
    const next = toolEvent(event, String(eventSequence.current++), sessionId);
    setEvents(current => [...current.slice(-49), next]);
  }, []);

  const forwardSessionEvent = useCallback(
    (event: SessionEvent) => {
      actorRef.current?.send(event);
      if (event.type === "TRANSPORT_LOST") dropLostTransport();
    },
    [dropLostTransport],
  );

  const startSessionListener = useCallback(
    (result: DeviceConnectionResult, sessionId: string) => {
      sessionActorRef.current?.stop();
      sessionActorRef.current = createSessionEventsActor(result.dmk, sessionId, forwardSessionEvent);
    },
    [forwardSessionEvent],
  );

  const adoptConnection = useCallback(
    async (result: DeviceConnectionResult) => {
      const nextPorts = createDeviceOnboardingPorts({
        dmk: result.dmk,
        sessionId: result.sessionId,
        connectedDevice: result.connectedDevice,
        wired: result.compatDeviceWired,
      });
      portsRef.current = nextPorts;
      const session = await nextPorts.openSession();

      setDevice({
        name: result.connectedDevice.name ?? String(session.deviceModelId),
        modelId: String(session.deviceModelId),
        sessionId: nextPorts.currentSessionId(),
        wired: result.compatDeviceWired,
      });
      setError(null);

      if (actorRef.current) {
        startSessionListener(result, nextPorts.currentSessionId());
        sessionReadyRef.current = true;
        setSendableEvents(availableEvents(actorRef.current, true));
        setStatus("running");
        return;
      }

      const actor = createActor(deviceOnboardingMachine, {
        input: {
          dmk: result.dmk,
          ports: delegatedPorts,
          deviceId: result.compatDeviceId,
          deviceModelId: session.deviceModelId,
          offerSync,
        },
        // The invoked actors reach the machine through `sendBack`, so a poll-driven STEP_CHANGED
        // never passes through `send`. Inspection is the only place that sees the whole traffic.
        inspect: inspectionEvent => {
          if (inspectionEvent.type !== "@xstate.event") return;
          if (inspectionEvent.actorRef !== actorRef.current) return;
          if (inspectionEvent.event.type.startsWith("xstate.")) return;

          const event = inspectionEvent.event as OnboardingEvent;
          appendEvent(event);
          if (event.type === "TRANSPORT_LOST") dropLostTransport();
        },
      });
      actorRef.current = actor;
      actor.subscribe(snapshot => {
        setState(stateValueToString(snapshot.value));
        setContext(flattenDeviceOnboardingContext(snapshot.context));
        setSendableEvents(availableEvents(actor, sessionReadyRef.current));

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
      startSessionListener(result, nextPorts.currentSessionId());
      setStatus("running");
    },
    [appendEvent, delegatedPorts, dropLostTransport, offerSync, startSessionListener],
  );

  const handleConnectionState = useCallback((connectionState: ConnectDeviceUIState) => {
    if (connectionState.type === ConnectDeviceUIStateTypes.Discovering) {
      const available = connectionState.devices.find(candidate => candidate.type === "available");
      if (available && !selectedDevices.current.has(available.knownDevice.id)) {
        selectedDevices.current.add(available.knownDevice.id);
        available.onSelect();
      }
      return;
    }

    if (connectionState.type === ConnectDeviceUIStateTypes.DiscoveryError) {
      setError(connectionState.error.type);
      retryRef.current = connectionState.retry ?? null;
      setStatus(actorRef.current ? "running" : "idle");
      return;
    }

    if (connectionState.type === ConnectDeviceUIStateTypes.ConnectionError) {
      setError(connectionState.error.type);
      retryRef.current = connectionState.retry;
      setStatus(actorRef.current ? "running" : "idle");
      return;
    }

    if (connectionState.type === ConnectDeviceUIStateTypes.NoKnownDevice) {
      setError("no-known-device");
      setStatus(actorRef.current ? "running" : "idle");
      return;
    }

    if (connectionState.type === ConnectDeviceUIStateTypes.UnknownError) {
      setError("unknown-error");
      setStatus(actorRef.current ? "running" : "idle");
    }
  }, []);

  const connect = useCallback(() => {
    if (!dmk) {
      setError("Device Management Kit is unavailable");
      return;
    }

    setError(null);
    setStatus("connecting");
    selectedDevices.current.clear();

    if (retryRef.current) {
      const retry = retryRef.current;
      retryRef.current = null;
      retry();
      return;
    }

    connectionRef.current?.unsubscribe();
    connectionRef.current = connectDevice({
      dmk,
      knownDevices,
      onConnected: result => {
        void adoptConnection(result).catch(() => {
          setError("Unable to start device onboarding");
          setStatus(actorRef.current ? "running" : "idle");
        });
      },
    }).subscribe({
      next: handleConnectionState,
      error: () => {
        setError("Unable to connect to the device");
        setStatus(actorRef.current ? "running" : "idle");
      },
    });
  }, [adoptConnection, dmk, handleConnectionState, knownDevices]);

  const send = useCallback(
    (event: OnboardingEvent) => {
      const actor = actorRef.current;
      if (!actor || !actor.getSnapshot().can(event)) return;

      if (event.type === "SESSION_READY") sessionReadyRef.current = false;
      actor.send(event);
    },
    [],
  );

  const reset = useCallback(() => {
    connectionRef.current?.unsubscribe();
    connectionRef.current = null;
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
    actorRef.current?.stop();
    actorRef.current = null;
    void portsRef.current?.closeSession();
    portsRef.current = null;
    retryRef.current = null;
    setStatus("idle");
    setDevice(null);
    setState(null);
    setContext(null);
    setEvents([]);
    setExit(null);
    setSendableEvents([]);
    setError(null);
    sessionReadyRef.current = false;
    lastLoggedStep.current = null;
  }, []);

  useEffect(
    () => () => {
      connectionRef.current?.unsubscribe();
      sessionActorRef.current?.stop();
      actorRef.current?.stop();
    },
    [],
  );

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
