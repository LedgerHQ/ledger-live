import { useCallback, useEffect, useRef, useState } from "react";
import type {
  DeviceManagementKit,
  DeviceModelId as DmkDeviceModelId,
} from "@ledgerhq/device-management-kit";
import type { DevToolsConfig } from "@devtools/shell";
import {
  useDeviceOnboardingActor,
  type DeviceOnboardingSession,
  type OnboardingActorSnapshot,
} from "@devtools/bindings";
import {
  createSessionEventsActor,
  stateValueToString,
  type DeviceOnboardingOutput,
} from "@ledgerhq/device-onboarding";
import type { Device } from "@ledgerhq/live-common/hw/actions/types";
import { dmkToLedgerDeviceIdMap, activeDeviceSessionSubject } from "@ledgerhq/live-dmk-shared";
import { createDeviceOnboardingPorts } from "../utils/ports";
import {
  firmwareUpdateDelegatedState,
  useFirmwareUpdateHandover,
} from "./useFirmwareUpdateHandover";

type DeviceOnboardingToolProps = Extract<
  DevToolsConfig[number],
  { id: "device-onboarding" }
>["config"];

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

function inFirmwareHandover(actor: { getSnapshot(): { value: unknown } }) {
  return stateValueToString(actor.getSnapshot().value) === firmwareUpdateDelegatedState;
}

export function useDeviceOnboarding(): DeviceOnboardingToolProps {
  const [status, setStatus] = useState<DeviceOnboardingToolProps["status"]>("idle");
  const [device, setDevice] = useState<DeviceOnboardingToolProps["device"]>(null);
  const [ledgerDeviceState, setLedgerDeviceState] = useState<Device | null>(null);
  const [error, setError] = useState<string | null>(null);

  const transportLostRef = useRef(false);
  const adoptGeneration = useRef(0);
  const dmkRef = useRef<DeviceManagementKit | null>(null);
  const lockListenerRef = useRef<{ sessionId: string; stop: () => void } | null>(null);
  const onSnapshotRef = useRef<
    (next: OnboardingActorSnapshot, previous: OnboardingActorSnapshot | null) => void
  >(() => undefined);
  const onDoneRef = useRef<(output: DeviceOnboardingOutput) => void>(() => undefined);

  const {
    state,
    context,
    log,
    exit,
    sendableEvents,
    nextStates,
    machine,
    setSessionReady,
    actorRef,
    portsRef,
    send,
    sendToActor,
    startActor,
    discardActor,
    resetActor,
    stopActor,
  } = useDeviceOnboardingActor({
    missingSessionMessage: "No desktop onboarding session",
    onSnapshot: (next, previous) => onSnapshotRef.current(next, previous),
    onDone: output => onDoneRef.current(output),
  });

  const resumeAfterFirmwareHandoverRef = useRef<
    (actorAtHandover: NonNullable<(typeof actorRef)["current"]>) => void
  >(() => undefined);

  const stopLockListener = useCallback(() => {
    lockListenerRef.current?.stop();
    lockListenerRef.current = null;
  }, []);

  const handleTransportLost = useCallback(() => {
    const actor = actorRef.current;
    if (!actor || transportLostRef.current) return;

    transportLostRef.current = true;
    stopLockListener();
    setSessionReady(false);
    setDevice(null);
    setLedgerDeviceState(null);
    if (actor.getSnapshot().can({ type: "TRANSPORT_LOST" })) {
      sendToActor({ type: "TRANSPORT_LOST" });
    }
  }, [actorRef, sendToActor, setSessionReady, stopLockListener]);

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
        if (actor && inFirmwareHandover(actor)) {
          lockListenerRef.current = null;
          queueMicrotask(() => entry.stop());
          return;
        }
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
  }, [actorRef, handleTransportLost, portsRef, sendToActor, stopLockListener]);

  const handleSnapshot = useCallback(
    (next: OnboardingActorSnapshot, previous: OnboardingActorSnapshot | null) => {
      const previousState = previous ? stateValueToString(previous.value) : null;
      const nextState = stateValueToString(next.value);
      const leftFirmwareHandover =
        previousState === firmwareUpdateDelegatedState &&
        nextState !== firmwareUpdateDelegatedState;
      const actorAtSnapshot = actorRef.current;
      syncLockListener();

      if (!leftFirmwareHandover || !actorAtSnapshot) return;

      queueMicrotask(() => {
        if (actorRef.current !== actorAtSnapshot) return;
        if (activeDeviceSessionSubject.value === null) {
          handleTransportLost();
          return;
        }
        resumeAfterFirmwareHandoverRef.current(actorAtSnapshot);
      });
    },
    [actorRef, handleTransportLost, syncLockListener],
  );

  const handleDone = useCallback(() => {
    stopLockListener();
    setStatus("exited");
  }, [stopLockListener]);

  useEffect(() => {
    onSnapshotRef.current = handleSnapshot;
    onDoneRef.current = handleDone;
  }, [handleDone, handleSnapshot]);

  const releaseFirmwareDrawer = useFirmwareUpdateHandover({
    device: ledgerDeviceState,
    machineState: state,
    send: sendToActor,
  });

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
    [portsRef, syncLockListener],
  );

  const startSessionActor = useCallback(
    (session: DeviceOnboardingSession) => {
      const connected = session.dmk.getConnectedDevice({ sessionId: session.sessionId });
      startActor({
        dmk: session.dmk,
        deviceId: connected.id,
        deviceModelId: session.deviceModelId,
        offerSync: false,
      });
      setStatus("running");
    },
    [startActor],
  );

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
        stopLockListener();
        discardActor();
      }

      const keepsRun = actorRef.current !== null;
      // The machine takes the new session first: `rememberDevice` starts the lock listener, a
      // locked device reports LOCKED at once, and unlock polling must start on this session.
      if (keepsRun) send({ type: "SESSION_CHANGED" });
      rememberDevice(session);
      setError(null);

      if (!keepsRun) {
        startSessionActor(session);
        return;
      }

      setSessionReady(true);
      if (autoResume) send({ type: "SESSION_READY" });
      setStatus("running");
    },
    [
      actorRef,
      discardActor,
      releaseFirmwareDrawer,
      rememberDevice,
      send,
      setSessionReady,
      startSessionActor,
      stopLockListener,
    ],
  );

  const resumeAfterFirmwareHandover = useCallback(
    (actorAtHandover: NonNullable<(typeof actorRef)["current"]>) => {
      const generation = adoptGeneration.current;
      void (async () => {
        try {
          const opened = await portsRef.current?.openSession();
          const stale =
            generation !== adoptGeneration.current || actorRef.current !== actorAtHandover;
          if (stale || !opened) return;
          continueWithSession(opened, true);
        } catch {
          if (generation === adoptGeneration.current && actorRef.current === actorAtHandover) {
            handleTransportLost();
          }
        }
      })();
    },
    [actorRef, continueWithSession, handleTransportLost, portsRef],
  );

  useEffect(() => {
    resumeAfterFirmwareHandoverRef.current = resumeAfterFirmwareHandover;
  }, [resumeAfterFirmwareHandover]);

  const adoptSession = useCallback(async () => {
    const generation = ++adoptGeneration.current;
    const recoveringFromLoss = transportLostRef.current;
    transportLostRef.current = false;
    const nextPorts = createDeviceOnboardingPorts();

    try {
      const session = await nextPorts.openSession();
      if (generation !== adoptGeneration.current) {
        await nextPorts.closeSession();
        return;
      }

      portsRef.current = nextPorts;
      continueWithSession(session, recoveringFromLoss);
    } catch {
      await nextPorts.closeSession();
      if (generation !== adoptGeneration.current) return;
      if (recoveringFromLoss) transportLostRef.current = true;
      setError("Unable to start device onboarding");
      setStatus(actorRef.current ? "running" : "idle");
    }
  }, [actorRef, continueWithSession, portsRef]);

  const connect = useCallback(() => {
    setError(null);
    setStatus("connecting");
    void adoptSession();
  }, [adoptSession]);

  const reset = useCallback(() => {
    adoptGeneration.current += 1;
    releaseFirmwareDrawer();
    stopLockListener();
    dmkRef.current = null;
    resetActor();
    void portsRef.current?.closeSession();
    portsRef.current = null;
    transportLostRef.current = false;
    setStatus("idle");
    setDevice(null);
    setLedgerDeviceState(null);
    setError(null);
  }, [portsRef, releaseFirmwareDrawer, resetActor, stopLockListener]);

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
  }, [actorRef, continueWithSession, handleTransportLost, portsRef]);

  useEffect(
    () => () => {
      adoptGeneration.current += 1;
      releaseFirmwareDrawer();
      stopLockListener();
      stopActor();
      void portsRef.current?.closeSession();
      portsRef.current = null;
    },
    [portsRef, releaseFirmwareDrawer, stopActor, stopLockListener],
  );

  return {
    status,
    device,
    state,
    context,
    log,
    exit,
    sendableEvents,
    nextStates,
    machine,
    error,
    connect,
    send,
    reset,
  };
}
