import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Subject } from "rxjs";
import { getEnv } from "../env";
import type { State } from "./types";
import { withDevice } from "../hw/deviceAccess";
import { resolveTransportModuleForDeviceId } from "../hw";
import BIM from "../api/BIM";

const getBaseApiUrl = () => getEnv("API_BIM");

const useBackgroundInstallSubject = (
  deviceId: string | undefined,
  state: State,
  onEventDispatch: (event) => void
): any => {
  // Whenever the queue changes, we need get a new token, but ONLY if this queue
  // change is because we are adding a new item and not because an item was consumed.
  const observable: any = useRef();
  const transportModule = resolveTransportModuleForDeviceId(deviceId || "");
  const disabled = transportModule?.id !== "ble-bim";
  const [transport, setTransport] = useState<any>();
  const [pendingTransport, setPendingTransport] = useState<boolean>(false);
  const [token, setToken] = useState<string | void>();
  const lastSeenQueueSize = useRef(0);
  const { installQueue, uninstallQueue, updateAllQueue } = state;
  const queueSize =
    installQueue.length + uninstallQueue.length + updateAllQueue.length;

  const shouldStartNewJob = useMemo(
    () => deviceId && !transport && !pendingTransport && token && queueSize,
    [deviceId, pendingTransport, queueSize, token, transport]
  );

  useEffect(() => {
    async function fetchToken() {
      const queue = BIM.buildQueueFromState(state);
      const token = await BIM.getTokenFromQueue(queue).catch((error) => {
        onEventDispatch({
          type: "runError",
          appOp: {},
          error,
        });
      });
      setToken(token);
    }
    if (disabled) return;
    if (queueSize > lastSeenQueueSize.current) {
      // If the queue is larger, our token is no longer valid and we need a new one.
      fetchToken();
    }
    // Always update the last seen
    lastSeenQueueSize.current = queueSize;
  }, [disabled, onEventDispatch, queueSize, setToken, state]);

  const cleanUp = useCallback(() => {
    setToken(undefined);
    setPendingTransport(false);
    setTransport(undefined);
  }, []);

  const startNewJob = useCallback(() => {
    let sub;
    if (deviceId) {
      setPendingTransport(true);
      sub = withDevice(deviceId)((transport) => {
        observable.current = new Subject();
        setTransport(transport);
        setPendingTransport(false);
        return observable.current;
      }).subscribe({
        next: onEventDispatch,
        error: (error) => {
          cleanUp();
          onEventDispatch({
            type: "runError",
            appOp: {},
            error,
          });
        },
        complete: cleanUp,
      });
    }

    return () => {
      sub?.unsubscribe();
    };
  }, [cleanUp, deviceId, onEventDispatch]);

  useEffect(() => {
    if (disabled) return;
    if (shouldStartNewJob) startNewJob();
  }, [deviceId, shouldStartNewJob, onEventDispatch, startNewJob, disabled]);

  useEffect(() => {
    if (disabled) return;
    if (!token || !transport) return;
    transport.queue(observable.current, token, getBaseApiUrl());
  }, [disabled, token, transport]);

  return !disabled;
};

export default useBackgroundInstallSubject;
