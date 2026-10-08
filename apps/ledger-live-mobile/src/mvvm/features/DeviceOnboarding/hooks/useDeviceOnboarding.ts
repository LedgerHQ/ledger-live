import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  deviceOnboardingMachine,
  type DeviceOnboardingOutput,
  type DeviceOnboardingPorts,
  type OnboardingEvent,
  type OnboardingStep,
  type SessionEvent,
} from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import {
  connectDevice,
  ConnectDeviceUIStateTypes,
  type ConnectDeviceUIState,
} from "@ledgerhq/live-dmk-mobile";
import {
  dmkToLedgerDeviceIdMap,
  type DeviceConnectionResult,
  type KnownDevice,
} from "@ledgerhq/live-dmk-shared";
import { createActor, type ActorRefFrom, type SnapshotFrom } from "xstate";
import type { Subscription } from "rxjs";
import { useDeviceOnboardingExit } from "./useDeviceOnboardingExit";
import { useFirmwareUpdateHandover } from "./useFirmwareUpdateHandover";
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
type OnboardingSnapshot = SnapshotFrom<typeof deviceOnboardingMachine>;
type ActorWithStop = { stop(): void };

const DeviceOnboardingStatus = {
  Idle: "idle",
  Connecting: "connecting",
  Running: "running",
  Exited: "exited",
} as const satisfies Record<string, DeviceOnboardingToolProps["status"]>;

const ActorStatus = {
  Active: "active",
  Done: "done",
} as const;

const MachineState = {
  AwaitingSession: "awaitingSession",
} as const;

const OnboardingEventType = {
  SessionReady: "SESSION_READY",
  TransportLost: "TRANSPORT_LOST",
  StepChanged: "STEP_CHANGED",
} as const satisfies Record<string, OnboardingEvent["type"]>;

const ErrorText = {
  NoSession: "No onboarding session",
  CouldNotStart: "Could not start device onboarding",
  NoKit: "Device Management Kit is not ready",
  CouldNotConnect: "Could not connect to the device",
} as const;

const Cable = {
  Usb: "USB",
} as const;

const DeviceKind = {
  Available: "available",
} as const;

const missingSessionId = "none";
const xstateEventPrefix = "xstate.";
const hiddenFromPossible = new Set(["LOCKED", "TRANSPORT_LOST", "QUIT"]);

type MachineNode = typeof deviceOnboardingMachine.root;

function stateName(node: MachineNode): string {
  return node.path.join(".");
}

function nodeAt(root: MachineNode, value: unknown): MachineNode | undefined {
  if (typeof value === "string") return root.states[value];
  if (!value || typeof value !== "object") return undefined;

  let node = root;
  for (const [key, child] of Object.entries(value)) {
    const next = node.states[key];
    if (!next) return undefined;
    if (typeof child === "string") return next.states[child];
    if (child && typeof child === "object") return nodeAt(next, child);
    node = next;
  }

  return node;
}

export function nextStatesFrom(
  snapshot: OnboardingSnapshot | null,
): DeviceOnboardingToolProps["nextStates"] {
  if (!snapshot || snapshot.status !== ActorStatus.Active) return [];

  const start = nodeAt(deviceOnboardingMachine.root, snapshot.value);
  if (!start) return [];

  const rows: DeviceOnboardingToolProps["nextStates"][number][] = [];
  const seen = new Set<string>();
  const add = (event: string, target: MachineNode | undefined) => {
    if (!target) return;
    const state = stateName(target);
    if (!state) return;
    const key = `${event}\0${state}`;
    if (seen.has(key)) return;
    seen.add(key);
    rows.push({ event, state });
  };

  const handledHere = new Set<string>();
  let node: MachineNode | undefined = start;
  while (node) {
    for (const transition of node.always ?? []) {
      for (const target of transition.target ?? []) add("auto", target);
    }
    for (const [event, transitions] of node.transitions) {
      if (
        event.startsWith(xstateEventPrefix) ||
        hiddenFromPossible.has(event) ||
        handledHere.has(event)
      ) {
        continue;
      }
      if (transitions.some(transition => transition.guard === undefined)) {
        handledHere.add(event);
      }
      for (const transition of transitions) {
        for (const target of transition.target ?? []) add(event, target);
      }
    }
    if (node === deviceOnboardingMachine.root) break;
    node = node.parent;
  }

  return rows;
}

function eventsWeCanSend(snapshot: OnboardingSnapshot | null, sessionReady: boolean) {
  if (!snapshot) return [];
  const choices: OnboardingEvent[] = sessionReady
    ? [{ type: OnboardingEventType.SessionReady }, ...userEvents]
    : [...userEvents];
  return choices.filter(event => snapshot.can(event)).map(event => ({ event }));
}

function statusFrom(
  snapshot: OnboardingSnapshot | null,
  connecting: boolean,
  error: string | null,
): DeviceOnboardingToolProps["status"] {
  if (connecting) return DeviceOnboardingStatus.Connecting;
  if (snapshot?.status === ActorStatus.Active) return DeviceOnboardingStatus.Running;
  if (snapshot?.status === ActorStatus.Done && error === null) return DeviceOnboardingStatus.Exited;
  return DeviceOnboardingStatus.Idle;
}

function readConnectedDevice(snapshot: OnboardingSnapshot) {
  return snapshot.context.dmk.getConnectedDevice({
    sessionId: snapshot.context.ports.currentSessionId(),
  });
}

function deviceForDevtool(
  snapshot: OnboardingSnapshot | null,
  sessionIsListening: boolean,
): DeviceOnboardingToolProps["device"] {
  if (!snapshot) return null;
  const state = stateValueToString(snapshot.value);
  if (
    snapshot.status === ActorStatus.Active &&
    state === MachineState.AwaitingSession &&
    !sessionIsListening
  ) {
    return null;
  }

  try {
    const connected = readConnectedDevice(snapshot);
    return {
      name: connected.name ?? String(snapshot.context.deviceModelId),
      modelId: String(snapshot.context.deviceModelId),
      sessionId: snapshot.context.ports.currentSessionId(),
      wired: connected.type === Cable.Usb,
    };
  } catch {
    return null;
  }
}

function deviceForScreen(snapshot: OnboardingSnapshot | null): Device | null {
  if (!snapshot) return null;

  try {
    const connected = readConnectedDevice(snapshot);
    return {
      deviceId: snapshot.context.deviceId,
      deviceName: connected.name ?? null,
      modelId: dmkToLedgerDeviceIdMap[snapshot.context.deviceModelId],
      wired: connected.type === Cable.Usb,
    };
  } catch {
    return {
      deviceId: snapshot.context.deviceId,
      deviceName: null,
      modelId: dmkToLedgerDeviceIdMap[snapshot.context.deviceModelId],
      wired: false,
    };
  }
}

export function useDeviceOnboarding({
  dmk,
  knownDevices,
  offerSync,
}: UseDeviceOnboardingInput): DeviceOnboardingToolProps {
  const [snapshot, setSnapshot] = useState<OnboardingSnapshot | null>(null);
  const [connecting, setConnecting] = useState(false);
  const [events, setEvents] = useState<DeviceOnboardingToolProps["events"]>([]);
  const [showNextScreen, setShowNextScreen] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const actorRef = useRef<OnboardingActor | null>(null);
  const portsRef = useRef<DeviceOnboardingPorts | null>(null);
  const sessionWatchRef = useRef<ActorWithStop | null>(null);
  const connectionRef = useRef<Subscription | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const logNumber = useRef(0);
  const lastStep = useRef<OnboardingStep | null>(null);
  const pickedDeviceIds = useRef(new Set<string>());
  const connectCount = useRef(0);

  const machinePorts = useRef<DeviceOnboardingPorts>({
    openSession: () => {
      if (!portsRef.current) throw new Error(ErrorText.NoSession);
      return portsRef.current.openSession();
    },
    currentSessionId: () => {
      if (!portsRef.current) throw new Error(ErrorText.NoSession);
      return portsRef.current.currentSessionId();
    },
    closeSession: () => portsRef.current?.closeSession() ?? Promise.resolve(),
  }).current;

  const state = snapshot ? stateValueToString(snapshot.value) : null;
  const sessionIsListening = sessionWatchRef.current !== null;
  const status = statusFrom(snapshot, connecting, error);
  const devtoolDevice = deviceForDevtool(snapshot, sessionIsListening);
  const context = snapshot ? flattenDeviceOnboardingContext(snapshot.context) : null;
  const output: DeviceOnboardingOutput | null =
    snapshot?.status === ActorStatus.Done ? snapshot.output : null;
  const exit = output
    ? {
        reason: output.reason,
        sessionId: output.sessionId,
        modelId: String(output.device.modelId),
      }
    : null;
  const sessionReady = sessionIsListening && state === MachineState.AwaitingSession;
  const sendableEvents = eventsWeCanSend(snapshot, sessionReady);
  const nextStates = nextStatesFrom(snapshot);
  const screenDevice = deviceForScreen(snapshot);

  const stopSessionWatch = useCallback(() => {
    sessionWatchRef.current?.stop();
    sessionWatchRef.current = null;
  }, []);

  const addLog = useCallback((event: OnboardingEvent) => {
    if (event.type === OnboardingEventType.StepChanged) {
      // The same step can come again for each seed word.
      // We log a step only when it changes.
      const step = event.state.currentOnboardingStep;
      if (step === lastStep.current) return;
      lastStep.current = step;
    }

    const sessionId = portsRef.current?.currentSessionId() ?? missingSessionId;
    const next = toolEvent(event, String(logNumber.current++), sessionId);
    setEvents(current => [...current.slice(-49), next]);
  }, []);

  const passSessionEvent = useCallback(
    (event: SessionEvent) => {
      actorRef.current?.send(event);
      if (event.type === OnboardingEventType.TransportLost) stopSessionWatch();
    },
    [stopSessionWatch],
  );

  const startSessionWatch = useCallback(
    (result: DeviceConnectionResult, sessionId: string) => {
      sessionWatchRef.current?.stop();
      sessionWatchRef.current = createSessionEventsActor(result.dmk, sessionId, passSessionEvent);
    },
    [passSessionEvent],
  );

  const afterConnect = useCallback(
    async (result: DeviceConnectionResult) => {
      const connectId = ++connectCount.current;
      const newPorts = createDeviceOnboardingPorts({
        dmk: result.dmk,
        sessionId: result.sessionId,
        wired: result.compatDeviceWired,
      });
      portsRef.current = newPorts;
      try {
        const session = await newPorts.openSession();

        if (connectId !== connectCount.current) {
          await newPorts.closeSession();
          return;
        }

        setError(null);

        if (actorRef.current) {
          startSessionWatch(result, newPorts.currentSessionId());
          setConnecting(false);
          return;
        }

        lastStep.current = null;

        const actor = createActor(deviceOnboardingMachine, {
          input: {
            dmk: result.dmk,
            ports: machinePorts,
            deviceId: result.compatDeviceId,
            deviceModelId: session.deviceModelId,
            offerSync,
          },
          // Child actors send STEP_CHANGED with sendBack.
          // Those events do not go through send.
          // This is the only place that sees them.
          inspect: seen => {
            if (seen.type !== "@xstate.event") return;
            if (seen.actorRef !== actorRef.current) return;
            if (seen.event.type.startsWith(xstateEventPrefix)) return;

            const event = seen.event as OnboardingEvent;
            addLog(event);
            if (event.type === OnboardingEventType.TransportLost) stopSessionWatch();
          },
        });
        actorRef.current = actor;
        actor.subscribe(next => {
          setSnapshot(next);

          if (next.status === ActorStatus.Done) {
            sessionWatchRef.current?.stop();
            sessionWatchRef.current = null;
            if (actorRef.current === actor) actorRef.current = null;
          }
        });
        startSessionWatch(result, newPorts.currentSessionId());
        actor.start();
        setConnecting(false);
      } catch {
        await newPorts.closeSession();
        if (connectId !== connectCount.current) return;

        setError(ErrorText.CouldNotStart);
        setConnecting(false);
      }
    },
    [addLog, machinePorts, offerSync, startSessionWatch, stopSessionWatch],
  );

  const onSearchUpdate = useCallback((searchState: ConnectDeviceUIState) => {
    switch (searchState.type) {
      case ConnectDeviceUIStateTypes.Discovering: {
        const found = searchState.devices.find(item => item.type === DeviceKind.Available);
        if (found && !pickedDeviceIds.current.has(found.knownDevice.id)) {
          pickedDeviceIds.current.add(found.knownDevice.id);
          found.onSelect();
        }
        break;
      }
      case ConnectDeviceUIStateTypes.DiscoveryError:
        setError(searchState.error.type);
        retryRef.current = searchState.retry ?? null;
        setConnecting(false);
        break;
      case ConnectDeviceUIStateTypes.ConnectionError:
        setError(searchState.error.type);
        retryRef.current = searchState.retry;
        setConnecting(false);
        break;
      case ConnectDeviceUIStateTypes.NoKnownDevice:
        setError(ConnectDeviceUIStateTypes.NoKnownDevice);
        setConnecting(false);
        break;
      case ConnectDeviceUIStateTypes.UnknownError:
        setError(ConnectDeviceUIStateTypes.UnknownError);
        setConnecting(false);
        break;
    }
  }, []);

  const connect = useCallback(() => {
    if (!dmk) {
      setError(ErrorText.NoKit);
      return;
    }

    setError(null);
    setConnecting(true);
    pickedDeviceIds.current.clear();

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
        void afterConnect(result);
      },
    }).subscribe({
      next: onSearchUpdate,
      error: () => {
        setError(ErrorText.CouldNotConnect);
        setConnecting(false);
      },
    });
  }, [afterConnect, dmk, knownDevices, onSearchUpdate]);

  const send = useCallback((event: OnboardingEvent) => {
    const actor = actorRef.current;
    if (!actor?.getSnapshot().can(event)) return;

    actor.send(event);
  }, []);

  const reset = useCallback(() => {
    connectCount.current += 1;
    connectionRef.current?.unsubscribe();
    connectionRef.current = null;
    sessionWatchRef.current?.stop();
    sessionWatchRef.current = null;
    actorRef.current?.stop();
    actorRef.current = null;
    void portsRef.current?.closeSession();
    portsRef.current = null;
    retryRef.current = null;
    setConnecting(false);
    setSnapshot(null);
    setEvents([]);
    setError(null);
    lastStep.current = null;
  }, []);

  useFirmwareUpdateHandover({
    device: screenDevice,
    machineState: state,
    send,
    showNextScreen,
  });
  useDeviceOnboardingExit({ device: screenDevice, output, showNextScreen });

  useEffect(
    () => () => {
      connectCount.current += 1;
      connectionRef.current?.unsubscribe();
      sessionWatchRef.current?.stop();
      actorRef.current?.stop();
    },
    [],
  );

  return {
    status,
    device: devtoolDevice,
    state,
    context,
    events,
    exit,
    sendableEvents,
    nextStates,
    error,
    connect,
    send,
    reset,
    showNextScreen,
    setShowNextScreen,
  };
}
