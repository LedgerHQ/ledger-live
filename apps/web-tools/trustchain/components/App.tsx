import dynamic from "next/dynamic";
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import styled from "styled-components";
import { Tooltip } from "react-tooltip";
import { MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { getInitialStore } from "@ledgerhq/trustchain/store";
import useEnv from "../useEnv";
import Expand from "./Expand";
import { getSdk } from "@ledgerhq/trustchain";
import { DisplayName, IdentityManager } from "./IdentityManager";
import { AppSetDeviceId } from "./AppSetDeviceId";
import { AppSetSupportedCurrencies } from "./AppSetSupportedCurrencies";
import { AppQRCodeCandidate } from "./AppQRCodeCandidate";
import { TrustchainSDKContext, defaultContext } from "../context";
import { AppQRCodeHost } from "./AppQRCodeHost";
import { AppMemberRow } from "./AppMemberRow";
import { AppDecryptUserData } from "./AppDecryptUserData";
import { AppEncryptUserData } from "./AppEncryptUserData";
import { AppDestroyTrustchain } from "./AppDestroyTrustchain";
import { AppGetMembers } from "./AppGetMembers";
import { AppGetOrCreateTrustchain } from "./AppGetOrCreateTrustchain";
import { AppInitLiveCredentials } from "./AppInitLiveCredentials";
import { AppMockEnv } from "./AppMockEnv";
import { AppSetTrustchainAPIEnv } from "./AppSetTrustchainAPIEnv";
import { AppRestoreTrustchain } from "./AppRestoreTrustchain";
import { AppWalletSync } from "./AppCloudSync";
import { AppSetCloudSyncAPIEnv } from "./AppSetCloudSyncAPIEnv";
import { DeviceInteractionLayer } from "./DeviceInteractionLayer";
import { initialState as walletInitialState } from "@ledgerhq/live-wallet/store";
import { DistantState, trustchainLifecycle } from "@ledgerhq/live-wallet/walletsync/index";
import { Loading } from "./Loading";
import { State } from "./types";

const Container = styled.div`
  padding: 0 10px 50px 0;
  margin: 0 auto;
  max-width: 800px;
  display: flex;
  flex-direction: column;
`;

const initialState: State = {
  accounts: [],
  nonImportedAccounts: [],
  walletState: walletInitialState,
};

const App = () => {
  const [context, setContext] = useState(defaultContext);
  const [deviceId, setDeviceId] = useState<string>("webhid");

  // this is the trustchain state as it widecryptUserDatall be used by Ledger Live (here, without redux)
  const [trustchainState, setTrustchainState] = useState(getInitialStore);
  const { memberCredentials, trustchain } = trustchainState;
  const setMemberCredentials = useCallback(
    (memberCredentials: MemberCredentials | null) =>
      setTrustchainState(s => ({ jwt: null, trustchain: null, memberCredentials })),
    [],
  );
  const cloudSyncApiBaseUrl = useEnv("CLOUD_SYNC_API_STAGING");
  const setTrustchain = useCallback(
    (trustchain: Trustchain | null) => setTrustchainState(s => ({ ...s, trustchain })),
    [],
  );

  // this is the accounts and wallet state as it will be used by Ledger Live (here, without redux)

  const [state, setState] = useState<State>(initialState);

  const accountsSyncControl = useState<boolean>(false);
  const [accountsSync, setAccountsSync] = accountsSyncControl;

  const takeControl = useCallback(() => {
    setAccountsSync(false);
  }, [setAccountsSync]);

  /*
  // turning accounts sync off will cascade to state reset
  useEffect(() => {
    if (!accountsSync) {
      setState(initialState);
    }
  }, [accountsSync]);
  */

  const [wssdkHandledVersion, setWssdkHandledVersion] = useState(0);
  const [wssdkHandledData, setWssdkHandledData] = useState<DistantState | null>(null);

  const version = state.walletState.walletSyncState.version || wssdkHandledVersion;
  const data = state.walletState.walletSyncState.data || wssdkHandledData;

  const wsStateRef = useRef({ version, data });
  useEffect(() => {
    wsStateRef.current = { version, data };
  }, [version, data]);

  const [members, setMembers] = useState<TrustchainMember[] | null>(null);

  // on live auth or trustchain change, we reset members
  useEffect(() => {
    setMembers(null);
  }, [memberCredentials, trustchain]);

  const mockEnv = useEnv("MOCK");

  const lifecycle = useMemo(
    () =>
      trustchainLifecycle({
        cloudSyncApiBaseUrl,
        getCurrentWSState: () => wsStateRef.current,
      }),
    [cloudSyncApiBaseUrl],
  );

  const sdk = useMemo(
    () => getSdk(!!mockEnv, context, lifecycle),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [
      mockEnv,
      context,
      // on identity change, we also reset the SDK
      memberCredentials,
    ],
  );
  const envTrustchainApiIsStg = useEnv("TRUSTCHAIN_API_STAGING").includes("stg");
  const envWalletSyncApiIsStg = useEnv("CLOUD_SYNC_API_STAGING").includes("stg");
  const envSummary = mockEnv
    ? "MOCK"
    : envTrustchainApiIsStg && envWalletSyncApiIsStg
      ? "STG"
      : !envTrustchainApiIsStg && !envWalletSyncApiIsStg
        ? "PROD"
        : "MIXED";

  const [deviceInteractionVisible, setDeviceInteractionVisible] = useState(false);
  const callbacks = useMemo(
    () => ({
      onStartRequestUserInteraction: () => setDeviceInteractionVisible(true),
      onEndRequestUserInteraction: () => setDeviceInteractionVisible(false),
    }),
    [],
  );

  return (
    <TrustchainSDKContext.Provider value={sdk}>
      <Container>
        <DeviceInteractionLayer visible={deviceInteractionVisible} />

        <h2>Wallet Sync Trustchain Playground</h2>

        <Expand
          title={
            <>
              <span
                data-tooltip-id="tooltip"
                data-tooltip-content="simulates different Live instance. persisted states and shared between browser tabs."
              >
                Identities
              </span>{" "}
              <span style={{ fontWeight: "normal" }}>
                <DisplayName pubkey={memberCredentials?.pubkey} />
              </span>
            </>
          }
        >
          <IdentityManager
            state={trustchainState}
            setState={setTrustchainState}
            defaultContext={defaultContext}
            setContext={setContext}
          />
        </Expand>

        <Expand
          title={
            <>
              <span>Environment</span>{" "}
              <code
                style={{
                  borderRadius: "4px",
                  padding: "3px 6px",
                  background: "#ddd",
                  color: "#000",
                }}
              >
                {envSummary}
              </code>
            </>
          }
        >
          <AppSetTrustchainAPIEnv />
          <AppSetCloudSyncAPIEnv />
          <AppMockEnv />
          <AppSetSupportedCurrencies />
          <AppSetDeviceId deviceId={deviceId} setDeviceId={setDeviceId} />
        </Expand>

        <Expand
          title={
            <>
              <span>Trustchain SDK</span>{" "}
              {trustchain ? (
                <code style={{ fontWeight: "normal" }}>
                  {trustchain.rootId.slice(0, 6)}..{trustchain.rootId.slice(-6)} at{" "}
                  {trustchain.applicationPath}
                </code>
              ) : null}
            </>
          }
          expanded={!trustchain}
        >
          <AppInitLiveCredentials
            memberCredentials={memberCredentials}
            setMemberCredentials={setMemberCredentials}
          />

          <AppGetOrCreateTrustchain
            deviceId={deviceId}
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            setTrustchain={setTrustchain}
            callbacks={callbacks}
          />

          <AppRestoreTrustchain
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            setTrustchain={setTrustchain}
          />

          <AppGetMembers
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            members={members}
            setMembers={setMembers}
          />

          {members?.map(member => (
            <AppMemberRow
              key={member.id}
              deviceId={deviceId}
              trustchain={trustchain}
              memberCredentials={memberCredentials}
              member={member}
              setTrustchain={setTrustchain}
              setMembers={setMembers}
              callbacks={callbacks}
            />
          ))}

          <AppEncryptUserData trustchain={trustchain} />

          <AppDecryptUserData trustchain={trustchain} />

          <AppDestroyTrustchain
            trustchain={trustchain}
            setTrustchain={setTrustchain}
            memberCredentials={memberCredentials}
          />

          <Expand title="QR Code Host">
            <AppQRCodeHost trustchain={trustchain} memberCredentials={memberCredentials} />
          </Expand>

          <Expand title="QR Code Candidate">
            <AppQRCodeCandidate
              memberCredentials={memberCredentials}
              setTrustchain={setTrustchain}
            />
          </Expand>
        </Expand>

        <Expand
          title={
            <>
              <span>Cloud Sync SDK</span>{" "}
              {version ? <code style={{ fontWeight: "normal" }}>Version: {version}</code> : null}
            </>
          }
        >
          {trustchain && memberCredentials ? (
            <AppWalletSync
              trustchain={trustchain}
              setTrustchain={setTrustchain}
              memberCredentials={memberCredentials}
              version={version}
              data={data}
              setVersion={setWssdkHandledVersion}
              setData={setWssdkHandledData}
              forceReadOnlyData={state.walletState.walletSyncState.data}
              readOnly={accountsSync}
              takeControl={takeControl}
            />
          ) : (
            "Please create a trustchain first"
          )}
        </Expand>

        <Expand title="Accounts Sync" dynamicControl={accountsSyncControl}>
          {trustchain && memberCredentials ? (
            <AppAccountsSync
              deviceId={deviceId}
              trustchain={trustchain}
              memberCredentials={memberCredentials}
              state={state}
              setState={setState}
              setTrustchain={setTrustchain}
            />
          ) : (
            "Prease create a trustchain first"
          )}
        </Expand>

        <Tooltip id="tooltip" />
      </Container>
    </TrustchainSDKContext.Provider>
  );
};

const AppAccountsSync = dynamic<{
  deviceId: string;
  trustchain: Trustchain;
  memberCredentials: MemberCredentials;
  state: State;
  setState: (_: (_: State) => State) => void;
  setTrustchain: (_: Trustchain | null) => void;
}>(() => import("./AppAccountsSync"), {
  loading: () => <Loading />,
});

export default App;
