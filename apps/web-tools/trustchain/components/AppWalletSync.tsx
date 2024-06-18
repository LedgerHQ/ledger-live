import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { JWT, MemberCredentials, Trustchain } from "@ledgerhq/trustchain/types";
import { useTrustchainSDK } from "../context";
import {
  WalletSyncSDK,
  AccountsData,
  accountsSchema,
  UpdateEvent,
} from "@ledgerhq/live-wallet/walletsync/index";
import { genAccount } from "@ledgerhq/coin-framework/mocks/account";
import { getDefaultAccountName } from "@ledgerhq/live-wallet/accountName";
import { Actionable } from "./Actionable";
import { JsonEditor } from "./JsonEditor";

export function AppWalletSync({
  trustchain,
  memberCredentials,
}: {
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
}) {
  const trustchainSdk = useTrustchainSDK();

  const [version, setVersion] = useState(0); // TODO this would need some persistance
  const [data, setData] = useState<AccountsData | null>(null);
  const [json, setJson] = useState<string>("");
  const [error, setError] = useState<string | null>(null);

  const onJsonEditorChange = useCallback((value: string) => {
    setJson(value);
    try {
      if (!value.trim()) {
        setData(null);
        setError(null);
        return;
      }
      const data = JSON.parse(value);
      const validated = accountsSchema.parse(data);
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

  const saveNewUpdate = useCallback(async (event: UpdateEvent) => {
    // in this current version, we just display the data as is, but in real app we would first reconciliate the account data and manage the sync
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
  }, []);

  const walletSyncSdk = useMemo(() => {
    return new WalletSyncSDK({
      trustchainSdk,
      getCurrentVersion,
      saveNewUpdate,
    });
  }, [trustchainSdk, getCurrentVersion, saveNewUpdate]);

  const onPull = useCallback(async () => {
    const jwt = await trustchainSdk.auth(trustchain, memberCredentials);
    await walletSyncSdk.pull(jwt, trustchain);
  }, [trustchainSdk, trustchain, memberCredentials, walletSyncSdk]);

  const onPush = useCallback(async () => {
    if (!data) return;
    const jwt = await trustchainSdk.auth(trustchain, memberCredentials);
    await walletSyncSdk.push(jwt, trustchain, data);
  }, [trustchainSdk, trustchain, memberCredentials, walletSyncSdk, data]);

  const onGenRandomAccountData = useCallback(() => {
    const names: Record<string, string> = {};
    const accounts = Array(Math.floor(5 * Math.random()))
      .fill(0)
      .map(() => {
        const account = genAccount(Math.random().toString());
        let name = getDefaultAccountName(account);
        if (Math.random() > 0.5) {
          name = "Renamed " + name;
        }
        names[account.id] = name;
        return {
          id: account.id,
          currencyId: account.currency.id,
          index: account.index,
          seedIdentifier: account.seedIdentifier,
          derivationMode: account.derivationMode,
          freshAddress: account.freshAddress,
        };
      });
    const data = { accounts, names };
    // locally reset the editor
    setData(data);
    setJson(JSON.stringify(data, null, 2));
  }, [setData]);

  const onDestroy = useCallback(async () => {
    const jwt = await trustchainSdk.auth(trustchain, memberCredentials);
    await walletSyncSdk.destroy(jwt);
  }, [trustchainSdk, trustchain, memberCredentials, walletSyncSdk]);

  return (
    <div>
      <div
        style={{
          display: "flex",
          flexDirection: "row",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <strong>Version: {version}</strong>
        <Actionable action={onPull} buttonTitle="Pull" inputs={[]}></Actionable>
        <Actionable action={onPush} buttonTitle="Push" inputs={[]} />
        <Actionable
          action={onGenRandomAccountData}
          buttonTitle="Gen Random Account Data"
          inputs={[]}
        />
        <Actionable action={onDestroy} buttonTitle="Destroy" inputs={[]} />
      </div>
      <JsonEditor value={json} onChange={onJsonEditorChange} />
      {error ? <div style={{ color: "red" }}>{error}</div> : null}
    </div>
  );
}
