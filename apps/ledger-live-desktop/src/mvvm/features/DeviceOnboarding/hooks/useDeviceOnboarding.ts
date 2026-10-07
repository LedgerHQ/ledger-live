import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DeviceManagementKit,
  DeviceModelId as DmkDeviceModelId,
} from "@ledgerhq/device-management-kit";
import type { DevToolsConfig } from "@devtools/shell";
import {
  createDelegatedPorts,
  createOnboardingEventLog,
  createSessionEventsActor,
  deviceOnboardingMachine,
  flattenDeviceOnboardingContext,
  stateValueToString,
  userEvents,
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
  firmwareUpdateDelegatedState,
  useFirmwareUpdateHandover,
} from "./useFirmwareUpdateHandover";

type DeviceOnboardingToolProps = Extract<
  DevToolsConfig[number],
  { id: "device-onboarding" }
>["config"];

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
  const dmkRef = useRef<DeviceManagementKit | null>(null);
  const lockListenerRef = useRef<{ sessionId: string; stop: () => void } | null>(null);
  const machineStateRef = useRef<string | null>(null);

  const delegatedPorts = useRef(
    createDelegatedPorts(() => portsRef.current, "No desktop onboarding session"),
  ).current;

  const appendEvent = useCallback((event: OnboardingEvent) => {
    createOnboardingEventLog({
      currentSessionId: () => portsRef.current?.currentSessionId(),
      lastLoggedStep,
      sequence: eventSequence,
      push: entry => setEvents(current => [...current.slice(-49), entry]),
    })(event);
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

  const stopLockListener = useCallback(() => {
    lockListenerRef.current?.stop();
    lockListenerRef.current = null;
  }, []);

  const handleTransportLost = useCallback(() => {
    const actor = actorRef.current;
    if (!actor || transportLostRef.current) return;

    transportLostRef.current = true;
    stopLockListener();
    sessionReadyRef.current = false;
    setDevice(null);
    setLedgerDeviceState(null);
    if (actor.getSnapshot().can({ type: "TRANSPORT_LOST" })) {
      sendToActor({ type: "TRANSPORT_LOST" });
    }
  }, [sendToActor, stopLockListener]);

  const syncLockListener = useCallback(() => {
    if (!actorRef.current) return;

    const dmk = dmkRef.current;
    const ports = portsRef.current;
    if (!dmk || !ports || transportLostRef.current) return;

    let sessionId: string;
    try {
      sessionId = ports.currentSessionId();
    } catch {
      return;
    }

    if (lockListenerRef.current?.sessionId === sessionId) return;
    stopLockListener();
    const entry: { sessionId: string; stop: () => void } = {
      sessionId,
      stop: () => undefined,
    };
    lockListenerRef.current = entry;
    const listener = createSessionEventsActor(dmk, sessionId, event => {
      if (lockListenerRef.current !== entry) return;
      const actor = actorRef.current;
      if (event.type === "TRANSPORT_LOST") {
        if (actor && inFirmwareHandover(actor)) return;
        handleTransportLost();
        return;
      }
      if (!actor?.getSnapshot().can(event)) return;
      sendToActor(event);
    });
    if (lockListenerRef.current !== entry) {
      listener.stop();
      return;
    }
    entry.stop = () => listener.stop();
  }, [handleTransportLost, sendToActor, stopLockListener]);

  const rememberDevice = useCallback(
    (session: DeviceOnboardingSession) => {
      dmkRef.current = session.dmk;
      const connected = session.dmk.getConnectedDevice({ sessionId: session.sessionId });
      setLedgerDeviceState(
        ledgerDevice(connected.id, connected.name ?? null, session.deviceModelId),
      );
      setDevice({
        name: connected.name ?? String(session.deviceModelId),
        modelId: String(session.deviceModelId),
        sessionId: portsRef.current?.currentSessionId() ?? session.sessionId,
        wired: true,
      });
      syncLockListener();
    },
    [syncLockListener],
  );

  const startActor = useCallback(
    (session: DeviceOnboardingSession) => {
      lastLoggedStep.current = null;
      const connected = session.dmk.getConnectedDevice({ sessionId: session.sessionId });
      const actor = createActor(deviceOnboardingMachine, {
        input: {
          dmk: session.dmk,
          ports: delegatedPorts,
          deviceId: connected.id,
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
        if (actorRef.current !== actor) return;
        const nextState = stateValueToString(snapshot.value);
        const leftFirmwareHandover =
          machineStateRef.current === firmwareUpdateDelegatedState &&
          nextState !== firmwareUpdateDelegatedState;
        machineStateRef.current = nextState;
        syncLockListener();
        setState(nextState);
        setContext(flattenDeviceOnboardingContext(snapshot.context));
        refreshSendable(actor);

        if (snapshot.status === "done") {
          stopLockListener();
          const output = snapshot.output;
          setExit({
            reason: output.reason,
            sessionId: output.sessionId,
            modelId: String(output.device.modelId),
          });
          setStatus("exited");
          if (actorRef.current === actor) actorRef.current = null;
        }

        if (leftFirmwareHandover && activeDeviceSessionSubject.value === null) {
          queueMicrotask(() => {
            if (actorRef.current !== actor) return;
            handleTransportLost();
          });
        }
      });
      actor.start();
      setStatus("running");
    },
    [
      appendEvent,
      delegatedPorts,
      handleTransportLost,
      refreshSendable,
      stopLockListener,
      syncLockListener,
    ],
  );

  const releaseFirmwareDrawer = useFirmwareUpdateHandover({
    device: ledgerDeviceState,
    machineState: state,
    send: sendToActor,
  });

  const continueWithSession = useCallback(
    (session: DeviceOnboardingSession, autoResume: boolean) => {
      const current = actorRef.current;
      const connected = session.dmk.getConnectedDevice({ sessionId: session.sessionId });
      const sameLedger =
        current !== null &&
        current.getSnapshot().context.deviceId === connected.id &&
        current.getSnapshot().context.deviceModelId === session.deviceModelId;

      if (current && !sameLedger) {
        releaseFirmwareDrawer();
        actorRef.current = null;
        stopLockListener();
        current.stop();
        setEvents([]);
        setExit(null);
        sessionReadyRef.current = false;
        machineStateRef.current = null;
      }

      rememberDevice(session);
      setError(null);

      if (!actorRef.current) {
        startActor(session);
        return;
      }

      sessionReadyRef.current = true;
      if (autoResume && actorRef.current.getSnapshot().can({ type: "SESSION_READY" })) {
        sendToActor({ type: "SESSION_READY" });
      } else {
        refreshSendable(actorRef.current);
      }
      setStatus("running");
    },
    [
      releaseFirmwareDrawer,
      rememberDevice,
      refreshSendable,
      sendToActor,
      startActor,
      stopLockListener,
    ],
  );

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

      continueWithSession(session, recoveringFromLoss);
    } catch {
      await nextPorts.closeSession();
      if (generation !== adoptGeneration.current) return;
      if (recoveringFromLoss) transportLostRef.current = true;
      setError("Unable to start device onboarding");
      setStatus(actorRef.current ? "running" : "idle");
    }
  }, [continueWithSession]);

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
    releaseFirmwareDrawer();
    stopLockListener();
    dmkRef.current = null;
    actorRef.current?.stop();
    actorRef.current = null;
    machineStateRef.current = null;
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
  }, [releaseFirmwareDrawer, stopLockListener]);

  useEffect(() => {
    const subscription = activeDeviceSessionSubject.subscribe(session => {
      const actor = actorRef.current;
      if (!actor) return;

      if (inFirmwareHandover(actor)) return;

      if (!session) {
        handleTransportLost();
        return;
      }

      if (
        !transportLostRef.current &&
        lockListenerRef.current?.sessionId === session.transport.sessionId
      ) {
        return;
      }

      handleTransportLost();
      transportLostRef.current = false;
      const generation = adoptGeneration.current;
      const actorAtLoss = actor;
      void (async () => {
        try {
          const opened = await portsRef.current?.openSession();
          const stale =
            generation !== adoptGeneration.current ||
            actorRef.current !== actorAtLoss ||
            transportLostRef.current;
          if (stale || !opened) return;
          continueWithSession(opened, true);
        } catch {
          if (generation === adoptGeneration.current && actorRef.current === actorAtLoss) {
            transportLostRef.current = true;
          }
        }
      })();
    });

    return () => subscription.unsubscribe();
  }, [continueWithSession, handleTransportLost]);

  useEffect(
    () => () => {
      adoptGeneration.current += 1;
      releaseFirmwareDrawer();
      stopLockListener();
      actorRef.current?.stop();
      actorRef.current = null;
    },
    [releaseFirmwareDrawer, stopLockListener],
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

function inFirmwareHandover(actor: OnboardingActor) {
  return stateValueToString(actor.getSnapshot().value) === firmwareUpdateDelegatedState;
}
