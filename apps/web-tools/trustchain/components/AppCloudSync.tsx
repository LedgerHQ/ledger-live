import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JWT, MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { useTrustchainSDK } from "../context";
import {
  CloudSyncSDK,
  LiveData,
  liveSchema,
  UpdateEvent,
} from "@ledgerhq/live-wallet/cloudsync/index";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { Actionable } from "./Actionable";
import { JsonEditor } from "./JsonEditor";

export function AppWalletSync({
  trustchain,
  memberCredentials,
  version,
  setVersion,
  forceReadOnlyData,
  readOnly,
  takeControl,
}: {
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
  version: number;
  setVersion: (n: number) => void;
  forceReadOnlyData?: LiveData | null;
  readOnly?: boolean;
  takeControl?: () => void;
}) {
  const trustchainSdk = useTrustchainSDK();

  const [data, setData] = useState<LiveData | null>(null);
  const [json, setJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (forceReadOnlyData) {
      setData(forceReadOnlyData);
      setJson(JSON.stringify(forceReadOnlyData, null, 2));
    }
  }, [forceReadOnlyData]);

  const onJsonEditorChange = useCallback((value: string) => {
    setJson(value);
    try {
      if (!value.trim()) {
        setData(null);
        setError(null);
        return;
      }
      const data = JSON.parse(value);
      const validated = liveSchema.parse(data);
      setData(validated);
      setError(null);
    } catch (e) {
      setError("Invalid data: " + String(e));
    }
  }, []);

  const versionRef = useRef(version);
  useEffect(() => {
    versionRef.current = version;
  }, [version]);

  const getCurrentVersion = useCallback(() => versionRef.current, []);

  const saveNewUpdate = useCallback(
    async (event: UpdateEvent) => {
      switch (event.type) {
        case "new-data":
          setVersion(event.version);
          setData(event.data);
          setJson(event.data ? JSON.stringify(event.data, null, 2) : "");
          break;
        case "pushed-data":
          setVersion(event.version);
          break;
        case "deleted-data":
          setVersion(0);
          setJson("");
          setData(null);
          break;
      }
    },
    [setVersion, setData, setJson],
  );

  const walletSyncSdk = useMemo(() => {
    return new CloudSyncSDK({ trustchainSdk, getCurrentVersion, saveNewUpdate });
  }, [trustchainSdk, getCurrentVersion, saveNewUpdate]);

  const onPull = useCallback(async () => {
    await walletSyncSdk.pull(trustchain, memberCredentials);
  }, [trustchain, memberCredentials, walletSyncSdk]);

  const onPush = useCallback(async () => {
    if (!data) return;
    await walletSyncSdk.push(trustchain, memberCredentials, data);
  }, [trustchain, memberCredentials, walletSyncSdk, data]);

  const onGenRandomAccountData = useCallback(() => {
    const accountNames: Record<string, string> = {};
    const accounts = Array(Math.floor(5 * Math.random()))
      .fill(0)
      .map(() => {
        const account = genAccount(Math.random().toString());
        let name = getDefaultAccountName(account);
        if (Math.random() > 0.5) {
          name = "Renamed " + name;
        }
        accountNames[account.id] = name;
        return {
          id: account.id,
          currencyId: account.currency.id,
          index: account.index,
          seedIdentifier: account.seedIdentifier,
          derivationMode: account.derivationMode,
          freshAddress: account.freshAddress,
        };
      });
    const data = { accounts, accountNames };
    // locally reset the editor
    setData(data);
    setJson(JSON.stringify(data, null, 2));
  }, [setData]);

  const onDestroy = useCallback(async () => {
    await walletSyncSdk.destroy(trustchain, memberCredentials);
  }, [trustchain, memberCredentials, walletSyncSdk]);

  const [onUnsubscribe, setSubscription] = useState<null | (() => void)>(null);

  const onListen = useCallback(async () => {
    await new Promise((success, failure) => {
      let pending = false;
      async function poll() {
        try {
          if (pending) return;
          pending = true;
          await walletSyncSdk.pull(trustchain, memberCredentials);
        } finally {
          pending = false;
        }
      }

      const subscription = walletSyncSdk
        .listenNotifications(trustchain, memberCredentials)
        .subscribe({
          next: () => {
            poll();
          },
          complete: () => {
            setSubscription(null);
            success(null);
          },
          error: failure,
        });
      setSubscription(() => () => {
        setSubscription(null);
        subscription.unsubscribe();
        success(null);
      });
    });
  }, [trustchain, memberCredentials, walletSyncSdk]);

  return (
    <div>
      {readOnly ? (
        <p>
          Accounts Sync was enabled. The data is read-only.{" "}
          <button onClick={() => takeControl && takeControl()}>Take Control Back</button>
        </p>
      ) : (
        <div
          style={{
            display: "flex",
            flexDirection: "row",
            alignItems: "center",
          }}
        >
          <Actionable action={onPull} buttonTitle="Pull" inputs={[]}></Actionable>
          <Actionable action={onPush} buttonTitle="Push" inputs={[]} />
          <Actionable action={onGenRandomAccountData} buttonTitle="🎲" inputs={[]} />
          <Actionable action={onDestroy} buttonTitle="Destroy" inputs={[]} />
          <Actionable action={onListen} buttonTitle="Listen" inputs={[]} />
          {onUnsubscribe ? (
            <a
              style={{
                cursor: "pointer",
                fontWeight: "bold",
                color: "black",
                textDecoration: "underline",
              }}
              onClick={onUnsubscribe}
            >
              Stop
            </a>
          ) : null}
        </div>
      )}
      <JsonEditor value={json} onChange={onJsonEditorChange} readOnly={readOnly} />
      {error ? <div style={{ color: "red" }}>{error}</div> : null}
    </div>
  );
}
