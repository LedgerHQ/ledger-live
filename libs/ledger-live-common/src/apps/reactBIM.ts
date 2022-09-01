import { useMemo, useCallback, useRef, useState, useEffect } from "react";
import { Subject } from "rxjs";
import { getEnv } from "../env";
import type { State } from "./types";
import { withDevice } from "../hw/deviceAccess";
import { useFeature } from "../featureFlags";
import { resolveTransportModuleForDeviceId } from "../hw";
import type { RunnerEvent } from "./types";
import BIM from "../api/BIM";

const getBaseApiUrl = () => getEnv("API_BIM");

const useBIM = (
  deviceId: string | undefined,
  state: State,
  onEventDispatch: (event) => void
): any => {
  // Whenever the queue changes, we need get a new token, but ONLY if this queue
  // change is because we are adding a new item and not because an item was consumed.
  const observable = useRef<Subject<RunnerEvent>>();
  const bimFeature = useFeature("bim");
  const transportModule = resolveTransportModuleForDeviceId(deviceId || "");
  const [transport, setTransport] = useState<any>(); // Nb maybe move the queue type into Transport
  const [pendingTransport, setPendingTransport] = useState<boolean>(false);
  const [token, setToken] = useState<string | void>("");
  const lastSeenQueueSize = useRef(0);
  const { installQueue, uninstallQueue, updateAllQueue } = state;
  const queueSize: number =
    installQueue.length + uninstallQueue.length + updateAllQueue.length;

  const shouldStartNewJob: boolean = useMemo(
    () => !!(deviceId && !transport && !pendingTransport && token && queueSize),
    [deviceId, pendingTransport, queueSize, token, transport]
  );

  const enabled: boolean =
    !!bimFeature?.enabled && transportModule?.id === "ble-bim";

  const cleanUp = useCallback(() => {
    setToken("");
    setPendingTransport(false);
    setTransport(undefined);
  }, []);

  useEffect(() => {
    if (lastSeenQueueSize.current !== queueSize && queueSize === 0) {
      // NB we've completed a queue. If we change the queue size before a cleanup,
      // do a quick cleanup now instead of waiting for the transport specific one.
      cleanUp();
    }
  }, [cleanUp, queueSize]);

  const onError = useCallback(
    (error) => {
      onEventDispatch({
        type: "runError",
        appOp: {},
        error,
      });
    },
    [onEventDispatch]
  );

  useEffect(() => {
    let completed = false;

    async function fetchToken() {
      const queue = BIM.buildQueueFromState(state);
      // NB We were experiencing cases where the user (QA) was putting the app to the back
      // before the token was fetched. This meant that the token resolution never happened
      // and the native side worked with an older version of the queue.
      // We are making that token resolution natively now, but I'm leaving this here in case
      // we can come up with something cleaner.
      // const token = await BIM.getTokenFromQueue(queue).catch(onError);
      // setToken(token);
      setToken(JSON.stringify({ tasks: queue })); // Breaks my heart.
    }

    if (!enabled || completed) return;

    if (queueSize > lastSeenQueueSize.current) {
      // If the queue is larger, our token is no longer valid and we need a new one.
      fetchToken();
    }
    // Always update the last seen
    lastSeenQueueSize.current = queueSize;

    return () => {
      completed = true;
    };
  }, [enabled, onError, onEventDispatch, queueSize, setToken, state]);

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
        error: onError,
        complete: () => {
          // Nb If this version is working better, remove the completion :thinkingface:
        },
      });
    }

    return () => {
      sub?.unsubscribe();
    };
  }, [deviceId, onError, onEventDispatch]);

  useEffect(() => {
    if (!enabled) return;
    if (shouldStartNewJob) startNewJob();
  }, [deviceId, shouldStartNewJob, onEventDispatch, startNewJob, enabled]);

  useEffect(() => {
    if (!enabled || !token || !transport) return;
    transport.queue(observable.current, token, getBaseApiUrl());
  }, [enabled, token, transport]);

  return enabled;
};

export default useBIM;
