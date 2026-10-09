import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { useDeviceOnboardingActor } from "@devtools/bindings";
import {
  createSessionEventsActor,
  stateValueToString,
  type OnboardingEvent,
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
import type { Subscription } from "rxjs";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import { useFirmwareUpdateHandover } from "./useFirmwareUpdateHandover";
import { useLeaveOnboarding } from "./useLeaveOnboarding";
import { createDeviceOnboardingPorts } from "../utils/ports";
import { type DeviceOnboardingToolProps } from "../utils/toolState";

type UseDeviceOnboardingInput = {
  dmk: DeviceManagementKit | null;
  knownDevices: KnownDevice[];
  offerSync: boolean;
};

type StoppableActor = { stop(): void };

const quittingStates = new Set(["quitting", "leavingOnQuit"]);

function statusWithActor(
  actor: { getSnapshot(): unknown } | null,
): DeviceOnboardingToolProps["status"] {
  return actor ? "running" : "idle";
}

export function useDeviceOnboarding({
  dmk,
  knownDevices,
  offerSync,
}: UseDeviceOnboardingInput): DeviceOnboardingToolProps {
  const [status, setStatus] = useState<DeviceOnboardingToolProps["status"]>("idle");
  const [device, setDevice] = useState<DeviceOnboardingToolProps["device"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveDevice, setLiveDevice] = useState<Device | null>(null);
  // Off by default: a QA run must not complete the app onboarding or leave the devtool.
  const [showNextScreen, setShowNextScreen] = useState(false);

  const leaveOnboarding = useLeaveOnboarding({
    device: liveDevice,
    navigateOnExit: showNextScreen,
  });

  const sessionActorRef = useRef<StoppableActor | null>(null);
  const connectionRef = useRef<Subscription | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const selectedDevices = useRef(new Set<string>());
  const adoptGeneration = useRef(0);
  const onEventRef = useRef<(event: OnboardingEvent) => void>(() => undefined);

  const handleDone = useCallback(() => {
    setStatus("exited");
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
    connectionRef.current?.unsubscribe();
    connectionRef.current = null;
  }, []);

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
    resetActor,
    stopActor,
  } = useDeviceOnboardingActor({
    missingSessionMessage: "No mobile onboarding session",
    onEvent: event => onEventRef.current(event),
    onDone: handleDone,
    leaveOnboarding,
  });

  const dropLostTransport = useCallback(() => {
    setSessionReady(false);
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
    setDevice(null);
  }, [setSessionReady]);

  const handleEvent = useCallback(
    (event: OnboardingEvent) => {
      if (event.type === "TRANSPORT_LOST") dropLostTransport();
    },
    [dropLostTransport],
  );

  useEffect(() => {
    onEventRef.current = handleEvent;
  }, [handleEvent]);

  const forwardSessionEvent = useCallback(
    (event: SessionEvent) => {
      sendToActor(event);
      if (event.type === "TRANSPORT_LOST") dropLostTransport();
    },
    [dropLostTransport, sendToActor],
  );

  const startSessionListener = useCallback(
    (result: DeviceConnectionResult, sessionId: string) => {
      sessionActorRef.current?.stop();
      sessionActorRef.current = createSessionEventsActor(
        result.dmk,
        sessionId,
        forwardSessionEvent,
      );
    },
    [forwardSessionEvent],
  );

  const adoptConnection = useCallback(
    async (result: DeviceConnectionResult) => {
      const generation = ++adoptGeneration.current;
      const nextPorts = createDeviceOnboardingPorts({
        dmk: result.dmk,
        sessionId: result.sessionId,
        wired: result.compatDeviceWired,
      });
      portsRef.current = nextPorts;
      try {
        const session = await nextPorts.openSession();

        if (generation !== adoptGeneration.current) {
          await nextPorts.closeSession();
          return;
        }

        setDevice({
          name: result.connectedDevice.name ?? String(session.deviceModelId),
          modelId: String(session.deviceModelId),
          sessionId: nextPorts.currentSessionId(),
          wired: result.compatDeviceWired,
        });
        setLiveDevice({
          deviceId: result.compatDeviceId,
          deviceName: result.compatDeviceName,
          modelId: dmkToLedgerDeviceIdMap[session.deviceModelId],
          wired: result.compatDeviceWired,
        });
        setError(null);

        if (actorRef.current) {
          // The machine takes the new session first: a locked device reports LOCKED as soon as
          // it is watched, and unlock polling must start on this session, not the lost one.
          send({ type: "SESSION_CHANGED" });
          startSessionListener(result, nextPorts.currentSessionId());
          setSessionReady(true);
          setStatus("running");
          return;
        }

        startActor(
          {
            dmk: result.dmk,
            deviceId: result.compatDeviceId,
            deviceModelId: session.deviceModelId,
            offerSync,
          },
          {
            beforeStart: () => startSessionListener(result, nextPorts.currentSessionId()),
          },
        );
        setStatus("running");
      } catch {
        await nextPorts.closeSession();
        if (generation !== adoptGeneration.current) return;

        setError("Unable to start device onboarding");
        setStatus(statusWithActor(actorRef.current));
      }
    },
    [actorRef, offerSync, portsRef, send, setSessionReady, startActor, startSessionListener],
  );

  const handleConnectionState = useCallback(
    (connectionState: ConnectDeviceUIState) => {
      switch (connectionState.type) {
        case ConnectDeviceUIStateTypes.Discovering: {
          const available = connectionState.devices.find(
            candidate => candidate.type === "available",
          );
          if (available && !selectedDevices.current.has(available.knownDevice.id)) {
            selectedDevices.current.add(available.knownDevice.id);
            available.onSelect();
          }
          break;
        }
        case ConnectDeviceUIStateTypes.DiscoveryError:
          setError(connectionState.error.type);
          retryRef.current = connectionState.retry ?? null;
          setStatus(statusWithActor(actorRef.current));
          break;
        case ConnectDeviceUIStateTypes.ConnectionError:
          setError(connectionState.error.type);
          retryRef.current = connectionState.retry;
          setStatus(statusWithActor(actorRef.current));
          break;
        case ConnectDeviceUIStateTypes.NoKnownDevice:
          setError("no-known-device");
          setStatus(statusWithActor(actorRef.current));
          break;
        case ConnectDeviceUIStateTypes.UnknownError:
          setError("unknown-error");
          setStatus(statusWithActor(actorRef.current));
          break;
      }
    },
    [actorRef],
  );

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
        void adoptConnection(result);
      },
    }).subscribe({
      next: handleConnectionState,
      error: () => {
        setError("Unable to connect to the device");
        setStatus(statusWithActor(actorRef.current));
      },
    });
  }, [actorRef, adoptConnection, dmk, handleConnectionState, knownDevices]);

  const clearRun = useCallback(() => {
    adoptGeneration.current += 1;
    connectionRef.current?.unsubscribe();
    connectionRef.current = null;
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
    resetActor();
    void portsRef.current?.closeSession();
    portsRef.current = null;
    retryRef.current = null;
    setStatus("idle");
    setDevice(null);
    setLiveDevice(null);
    setError(null);
  }, [portsRef, resetActor]);

  // Quit first, so the device leaves the flow before the screen is cleared.
  const reset = useCallback(() => {
    const actor = actorRef.current;
    if (actor?.getSnapshot().can({ type: "QUIT" })) {
      sendToActor({ type: "QUIT" });
      const after = actor.getSnapshot();
      if (after.status !== "done" && quittingStates.has(stateValueToString(after.value))) {
        adoptGeneration.current += 1;
        // A lock or a lost connection can pull the machine out of quitting before it is done.
        const subscription = actor.subscribe(next => {
          const quitting = quittingStates.has(stateValueToString(next.value));
          if (next.status !== "done" && quitting) return;
          subscription.unsubscribe();
          clearRun();
        });
        return;
      }
    }

    clearRun();
  }, [actorRef, clearRun, sendToActor]);

  useFirmwareUpdateHandover({
    device: liveDevice,
    machineState: state,
    send,
  });
  useKeepScreenAwake(status === "connecting" || status === "running");

  useEffect(
    () => () => {
      adoptGeneration.current += 1;
      connectionRef.current?.unsubscribe();
      sessionActorRef.current?.stop();
      stopActor();
    },
    [stopActor],
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
    showNextScreen,
    setShowNextScreen,
  };
}
