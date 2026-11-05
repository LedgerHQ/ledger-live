import { useCallback, useEffect, useRef, useState } from "react";
import type { DeviceManagementKit } from "@ledgerhq/device-management-kit";
import {
  createSessionEventsActor,
  stateValueToString,
  useDeviceOnboardingActor,
  type DeviceOnboardingActorSession,
  type DeviceOnboardingContext,
  type DeviceOnboardingExitReason,
  type OnboardingEvent,
  type OnboardingInspectionEvent,
  type SessionEvent,
} from "@features/platform-device-onboarding";
import { useFeature } from "@features/platform-feature-flags";
import { flagRegistry } from "@shared/feature-flags";
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
import { useSelector } from "~/context/hooks";
import { useKeepScreenAwake } from "~/hooks/useKeepScreenAwake";
import { isMockServerEnabledSelector } from "~/reducers/settings";
import { isRebootedDevice, useFirmwareUpdateHandover } from "./useFirmwareUpdateHandover";
import { useLeaveOnboarding } from "./useLeaveOnboarding";
import { createDeviceOnboardingPorts } from "../utils/ports";

type UseDeviceOnboardingInput = {
  dmk: DeviceManagementKit | null;
  knownDevices: KnownDevice[];
  offerSync: boolean;
  navigateOnExit?: boolean;
  wasReadOnlyAtEntry?: boolean;
  /** Whether the user accepted a firmware update during this onboarding. */
  firmwareUpdateDone?: boolean;
  /** Runs right before the exit navigates, so the host can stop blocking back. */
  onLeave?: (reason: DeviceOnboardingExitReason, context: DeviceOnboardingContext) => void;
  /** Watches every machine update from the actor's creation. The funnel passes none. */
  inspect?: (event: OnboardingInspectionEvent) => void;
};

type StoppableActor = { stop(): void };

const defaultFlagParams = flagRegistry.deviceOnboarding.parse(undefined).params;

export type DeviceOnboardingStatus = "idle" | "connecting" | "running" | "exited";

export type DeviceOnboardingDevice = {
  readonly name: string;
  readonly modelId: string;
  readonly sessionId: string;
  readonly wired: boolean;
};

export type DeviceOnboardingSession = Pick<
  DeviceOnboardingActorSession,
  "state" | "context" | "snapshot" | "exit" | "sendableEvents" | "send" | "actorRef" | "portsRef"
> & {
  status: DeviceOnboardingStatus;
  /** Null while `running` means the transport went away, which re-enables Connect. */
  device: DeviceOnboardingDevice | null;
  /** Set when the host failed to connect a device or to start the flow. */
  error: string | null;
  connect: () => void;
  reset: () => void;
  liveDevice: Device | null;
  /** Drops a firmware lookup that has not opened its screen yet. */
  closeFirmwareHandover: () => void;
  abortFirmwareReconnect: () => void;
};

async function releaseDeviceSession(
  dmk: DeviceManagementKit | null,
  ports: { closeSession: () => Promise<void>; currentSessionId: () => string } | null,
): Promise<void> {
  const sessionId = ports?.currentSessionId() ?? null;
  await ports?.closeSession().catch(() => undefined);
  if (!dmk || !sessionId) return;
  await dmk.disconnect({ sessionId }).catch(() => undefined);
}

function statusWithActor(actor: { getSnapshot(): unknown } | null): DeviceOnboardingStatus {
  return actor ? "running" : "idle";
}

export function useDeviceOnboarding({
  dmk,
  knownDevices,
  offerSync,
  navigateOnExit = true,
  wasReadOnlyAtEntry = false,
  firmwareUpdateDone = false,
  onLeave,
  inspect,
}: UseDeviceOnboardingInput): DeviceOnboardingSession {
  const isMockServerEnabled = useSelector(isMockServerEnabledSelector);
  const [status, setStatus] = useState<DeviceOnboardingStatus>("idle");
  const [device, setDevice] = useState<DeviceOnboardingSession["device"]>(null);
  const [error, setError] = useState<string | null>(null);
  const [liveDevice, setLiveDevice] = useState<Device | null>(null);
  const feature = useFeature("deviceOnboarding");
  // A saved value can predate a new param, so the param falls back to its default.
  const hostsSeedSetup = Boolean(
    feature?.enabled && { ...defaultFlagParams, ...feature.params }.connectUnseededDevice,
  );
  const leaveOnboarding = useLeaveOnboarding({
    device: liveDevice,
    navigateOnExit,
    wasReadOnlyAtEntry,
    firmwareUpdateDone,
  });

  const sessionActorRef = useRef<StoppableActor | null>(null);
  const connectionRef = useRef<Subscription | null>(null);
  const retryRef = useRef<(() => void) | null>(null);
  const selectedDevices = useRef(new Set<string>());
  const adoptGeneration = useRef(0);
  const onEventRef = useRef<(event: OnboardingEvent) => void>(() => undefined);
  const waitingAfterUpdateRef = useRef(false);
  const liveDeviceRef = useRef(liveDevice);
  const expectedDeviceRef = useRef<Device | null>(null);
  const releasedSessionRef = useRef<string | null>(null);
  const releaseRef = useRef<Promise<void>>(Promise.resolve());
  const connectRef = useRef<() => void>(() => undefined);

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
    snapshot,
    exit,
    sendableEvents,
    setSessionReady,
    actorRef,
    portsRef,
    send,
    sendToActor,
    startActor,
    discardActor,
    resetActor,
  } = useDeviceOnboardingActor({
    missingSessionMessage: "No mobile onboarding session",
    inspect,
    onEvent: event => onEventRef.current(event),
    onDone: handleDone,
    leaveOnboarding: (reason, context) => {
      onLeave?.(reason, context);
      leaveOnboarding(reason, context);
    },
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
      const previousPorts = portsRef.current;
      portsRef.current = nextPorts;
      if (previousPorts && previousPorts.currentSessionId() !== nextPorts.currentSessionId()) {
        await previousPorts.closeSession().catch(() => undefined);
      }
      try {
        const session = await nextPorts.openSession();

        if (generation !== adoptGeneration.current) {
          await nextPorts.closeSession();
          return;
        }

        const incomingDevice: Device = {
          deviceId: result.compatDeviceId,
          deviceName: result.compatDeviceName,
          modelId: dmkToLedgerDeviceIdMap[session.deviceModelId],
          wired: result.compatDeviceWired,
        };
        const expectedDevice = expectedDeviceRef.current;
        const reusedSession = result.sessionId === releasedSessionRef.current;
        const differentDevice =
          expectedDevice !== null && !isRebootedDevice(expectedDevice, incomingDevice);
        if (
          actorRef.current &&
          waitingAfterUpdateRef.current &&
          (reusedSession || differentDevice)
        ) {
          await nextPorts.closeSession().catch(() => undefined);
          await result.dmk.disconnect({ sessionId: result.sessionId }).catch(() => undefined);
          if (generation !== adoptGeneration.current) return;
          if (portsRef.current === nextPorts) portsRef.current = null;
          setError("Unable to reconnect to the device");
          setStatus(statusWithActor(actorRef.current));
          return;
        }

        setDevice({
          name: result.connectedDevice.name ?? String(session.deviceModelId),
          modelId: String(session.deviceModelId),
          sessionId: nextPorts.currentSessionId(),
          wired: result.compatDeviceWired,
        });
        setLiveDevice(incomingDevice);
        setError(null);

        if (actorRef.current && waitingAfterUpdateRef.current) {
          send({ type: "SESSION_READY" });
          const stillWaiting =
            stateValueToString(actorRef.current.getSnapshot().value) ===
            "awaitingSessionAfterFirmwareUpdate";
          if (stillWaiting) {
            setError("Unable to reconnect to the device");
            setStatus(statusWithActor(actorRef.current));
            return;
          }
          waitingAfterUpdateRef.current = false;
          startSessionListener(result, nextPorts.currentSessionId());
          setSessionReady(true);
          setStatus("running");
          return;
        }

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
            hostsSeedSetup,
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
    [
      actorRef,
      hostsSeedSetup,
      offerSync,
      portsRef,
      send,
      setSessionReady,
      startActor,
      startSessionListener,
    ],
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
      isMockServerEnabled,
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
  }, [actorRef, adoptConnection, dmk, handleConnectionState, knownDevices, isMockServerEnabled]);

  const reset = useCallback(() => {
    adoptGeneration.current += 1;
    connectionRef.current?.unsubscribe();
    connectionRef.current = null;
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
    const ports = portsRef.current;
    portsRef.current = null;
    void resetActor().then(() => ports?.closeSession());
    retryRef.current = null;
    setStatus("idle");
    setDevice(null);
    setLiveDevice(null);
    setError(null);
  }, [portsRef, resetActor]);

  const reconnectAfterUpdate = useCallback(() => {
    const actor = actorRef.current;
    if (!actor?.getSnapshot().can({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" })) return;
    waitingAfterUpdateRef.current = true;
    expectedDeviceRef.current = liveDeviceRef.current;
    releasedSessionRef.current = portsRef.current?.currentSessionId() ?? null;
    dropLostTransport();
    send({ type: "FIRMWARE_UPDATE_RECONNECT_REQUIRED" });
    const ports = portsRef.current;
    portsRef.current = null;
    const generation = adoptGeneration.current;
    releaseRef.current = releaseDeviceSession(dmk, ports).then(() => {
      if (generation !== adoptGeneration.current || !waitingAfterUpdateRef.current) return;
      connectRef.current();
    });
  }, [actorRef, dmk, dropLostTransport, portsRef, send]);
  const abortFirmwareReconnect = useCallback(() => {
    adoptGeneration.current += 1;
    waitingAfterUpdateRef.current = false;
    connectionRef.current?.unsubscribe();
    connectionRef.current = null;
    sessionActorRef.current?.stop();
    sessionActorRef.current = null;
    const actor = actorRef.current;
    if (
      actor &&
      stateValueToString(actor.getSnapshot().value) === "awaitingSessionAfterFirmwareUpdate"
    ) {
      send({ type: "QUIT" });
    }
    discardActor();
    actor?.stop();
    const ports = portsRef.current;
    portsRef.current = null;
    void releaseDeviceSession(dmk, ports);
    retryRef.current = null;
    setStatus("idle");
    setDevice(null);
    setLiveDevice(null);
    setError(null);
  }, [actorRef, discardActor, dmk, portsRef, send]);
  useEffect(() => {
    liveDeviceRef.current = liveDevice;
    connectRef.current = connect;
  }, [connect, liveDevice]);
  const { close: closeFirmwareHandover } = useFirmwareUpdateHandover({
    device: liveDevice,
    isDeviceOnboarded: context?.isOnboarded ?? false,
    machineState: state,
    currentSessionId: device?.sessionId ?? null,
    send,
    onReconnectRequired: reconnectAfterUpdate,
  });
  useKeepScreenAwake(status === "connecting" || status === "running");

  useEffect(
    () => () => {
      adoptGeneration.current += 1;
      connectionRef.current?.unsubscribe();
      sessionActorRef.current?.stop();
      const ports = portsRef.current;
      portsRef.current = null;
      void resetActor().then(() => ports?.closeSession());
    },
    [portsRef, resetActor],
  );

  return {
    status,
    device,
    liveDevice,
    state,
    context,
    snapshot,
    exit,
    sendableEvents,
    error,
    connect,
    send,
    reset,
    closeFirmwareHandover,
    abortFirmwareReconnect,
    actorRef,
    portsRef,
  };
}
