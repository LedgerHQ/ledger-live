import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import { useDeviceOnboardingActor } from "@devtools/bindings";
import {
  createSessionEventsActor,
  type DeviceOnboardingOutput,
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
import { useDeviceOnboardingExit } from "./useDeviceOnboardingExit";
import { useFirmwareUpdateHandover } from "./useFirmwareUpdateHandover";
import { createDeviceOnboardingPorts } from "../utils/ports";
import { type DeviceOnboardingToolProps } from "../utils/toolState";

type UseDeviceOnboardingInput = {
  dmk: DeviceManagementKit | null;
  knownDevices: KnownDevice[];
  offerSync: boolean;
  navigateOnExit?: boolean;
};

type StoppableActor = { stop(): void };

function statusWithActor(
  actor: { getSnapshot(): unknown } | null,
): DeviceOnboardingToolProps["status"] {
  return actor ? "running" : "idle";
}

export function useDeviceOnboarding({
  dmk,
  knownDevices,
  offerSync,
  navigateOnExit = true,
}: UseDeviceOnboardingInput): DeviceOnboardingToolProps {
  const [status, setStatus] = useState<DeviceOnboardingToolProps["status"]>("idle");
  const [device, setDevice] = useState<DeviceOnboardingToolProps["device"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveDevice, setLiveDevice] = useState<Device | null>(null);
  const [output, setOutput] = useState<DeviceOnboardingOutput | null>(null);

  const sessionActorRef = useRef<StoppableActor | null>(null);
  const connectionRef = useRef<Subscription | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const selectedDevices = useRef(new Set<string>());
  const adoptGeneration = useRef(0);
  const onEventRef = useRef<(event: OnboardingEvent) => void>(() => undefined);
  const onDoneRef = useRef<(output: DeviceOnboardingOutput) => void>(() => undefined);

  const {
    state,
    context,
    events,
    exit,
    sendableEvents,
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
    onDone: done => onDoneRef.current(done),
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

  const handleDone = useCallback((done: DeviceOnboardingOutput) => {
    setOutput(done);
    setStatus("exited");
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
  }, []);

  useEffect(() => {
    onEventRef.current = handleEvent;
    onDoneRef.current = handleDone;
  }, [handleDone, handleEvent]);

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
          startSessionListener(result, nextPorts.currentSessionId());
          setSessionReady(true);
          setStatus("running");
          return;
        }

        setOutput(null);
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
    [actorRef, offerSync, portsRef, setSessionReady, startActor, startSessionListener],
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

  const reset = useCallback(() => {
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
    setOutput(null);
    setError(null);
  }, [portsRef, resetActor]);

  useFirmwareUpdateHandover({
    device: liveDevice,
    machineState: state,
    send,
  });
  useDeviceOnboardingExit({ device: liveDevice, output, navigateOnExit });

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
    events,
    exit,
    sendableEvents,
    error,
    connect,
    send,
    reset,
  };
}
