import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { CloudSyncSDK, type UpdateEvent } from "@shared/cloud-sync";
import type { CloudSyncDevToolProps } from "../types";

const LIVE_SLUG = "live";

export function useCloudSyncViewModel(props: CloudSyncDevToolProps) {
  const {
    createSdk,
    liveState,
    cloudSyncApiBaseUrl,
    trustchainApiBaseUrl,
    walletSyncVersion,
    useProd,
    setUseProd,
  } = props;

  const [version, setVersion] = useState(0);
  const [json, setJson] = useState("");
  const [listening, setListening] = useState(false);
  const [listenError, setListenError] = useState<string | null>(null);
  const unsubscribeRef = useRef<(() => void) | null>(null);

  const versionRef = useRef(version);
  versionRef.current = version;
  const walletSyncVersionRef = useRef(walletSyncVersion);
  walletSyncVersionRef.current = walletSyncVersion;
  const liveStateRef = useRef(liveState);
  liveStateRef.current = liveState;

  const saveNewUpdate = useCallback(async (event: UpdateEvent<Record<string, unknown>>) => {
    switch (event.type) {
      case "new-data":
        setVersion(event.version);
        setJson(event.data != null ? JSON.stringify(event.data, null, 2) : "");
        break;
      case "pushed-data":
        setVersion(event.version);
        break;
      case "deleted-data":
        setVersion(0);
        setJson("");
        break;
    }
  }, []);

  const sdk = useMemo(
    () =>
      new CloudSyncSDK({
        apiBaseUrl: cloudSyncApiBaseUrl,
        slug: LIVE_SLUG,
        trustchainSdk: createSdk({ trustchainApiBaseUrl }),
        getCurrentVersion: () => walletSyncVersionRef.current ?? versionRef.current,
        saveNewUpdate,
      }),
    [cloudSyncApiBaseUrl, trustchainApiBaseUrl, createSdk, saveNewUpdate],
  );

  // Stop listening when the SDK instance changes (e.g. STG/PROD toggle) to avoid stale subscriptions
  useEffect(() => {
    return () => {
      unsubscribeRef.current?.();
      unsubscribeRef.current = null;
      setListening(false);
      setListenError(null);
    };
  }, [sdk]);

  const pull = useCallback(async () => {
    if (!liveState?.trustchain || !liveState.memberCredentials) return;
    await sdk.pull(liveState.trustchain, liveState.memberCredentials);
  }, [sdk, liveState]);

  const push = useCallback(async () => {
    if (!liveState?.trustchain || !liveState.memberCredentials || !json.trim()) return;
    const data = JSON.parse(json);
    await sdk.push(liveState.trustchain, liveState.memberCredentials, data);
  }, [sdk, liveState, json]);

  const destroy = useCallback(async () => {
    if (!liveState?.trustchain || !liveState.memberCredentials) return;
    await sdk.destroy(liveState.trustchain, liveState.memberCredentials);
  }, [sdk, liveState]);

  const listen = useCallback(async () => {
    if (!liveState?.trustchain || !liveState.memberCredentials) return;
    if (unsubscribeRef.current) return;
    setListenError(null);
    setListening(true);
    try {
      const sub = sdk
        .listenNotifications(liveState.trustchain, liveState.memberCredentials)
        .subscribe({
          next: () => {
            const ls = liveStateRef.current;
            if (ls?.trustchain && ls.memberCredentials) {
              sdk.pull(ls.trustchain, ls.memberCredentials).catch(e => {
                setListenError(String(e));
                setListening(false);
                unsubscribeRef.current?.();
                unsubscribeRef.current = null;
              });
            }
          },
          complete: () => {
            setListening(false);
            unsubscribeRef.current = null;
          },
          error: e => {
            setListenError(String(e));
            setListening(false);
            unsubscribeRef.current = null;
          },
        });
      unsubscribeRef.current = () => sub.unsubscribe();
    } catch (e) {
      setListenError(String(e));
      setListening(false);
    }
  }, [sdk, liveState]);

  const stopListen = useCallback(() => {
    unsubscribeRef.current?.();
    unsubscribeRef.current = null;
    setListening(false);
    setListenError(null);
  }, []);

  const isReady = !!(liveState?.trustchain && liveState.memberCredentials);
  const canPush = isReady && !!json.trim();

  // Effective version — prefer the app's Redux version when available
  const displayVersion = walletSyncVersion ?? version;

  return {
    version: displayVersion,
    json,
    setJson,
    listening,
    listenError,
    isReady,
    canPush,
    pull,
    push,
    destroy,
    listen,
    stopListen,
    liveState,
    cloudSyncApiBaseUrl,
    useProd,
    setUseProd,
  };
}

export type CloudSyncViewModel = ReturnType<typeof useCloudSyncViewModel>;
