import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Tooltip } from "react-tooltip";
import { JWT, MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
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
import { AppAuthenticate } from "./AppAuthenticate";
import { AppGetOrCreateTrustchain } from "./AppGetOrCreateTrustchain";
import { AppDeviceAuthenticate } from "./AppDeviceAuthenticate";
import { AppInitLiveCredentials } from "./AppInitLiveCredentials";
import { AppMockEnv } from "./AppMockEnv";
import { AppSetTrustchainAPIEnv } from "./AppSetTrustchainAPIEnv";
import { AppRestoreTrustchain } from "./AppRestoreTrustchain";
import { AppWalletSync } from "./AppCloudSync";
import { AppSetCloudSyncAPIEnv } from "./AppSetCloudSyncAPIEnv";

const Container = styled.div`
  padding: 0 10px 50px 0;
  margin: 0 auto;
  max-width: 800px;
  display: flex;
  flex-direction: column;
`;

const App = () => {
  const [context, setContext] = useState(defaultContext);
  const [deviceJWT, setDeviceJWT] = useState<JWT | null>(null);
  const [deviceId, setDeviceId] = useState<string>("webhid");

  // this is the trustchain state as it widecryptUserDatall be used by Ledger Live (here, without redux)
  const [trustchainState, setTrustchainState] = useState(getInitialStore);
  const { memberCredentials, trustchain } = trustchainState;
  const setMemberCredentials = useCallback(
    (memberCredentials: MemberCredentials | null) =>
      setTrustchainState(s => ({ trustchain: null, memberCredentials })),
    [],
  );
  const setTrustchain = useCallback(
    (trustchain: Trustchain | null) => setTrustchainState(s => ({ ...s, trustchain })),
    [],
  );

  const [wssdkHandledVersion, setWssdkHandledVersion] = useState(0);

  const version = wssdkHandledVersion;

  const [jwt, setJWT] = useState<JWT | null>(null);

  // on identity change, we reset jwt
  useEffect(() => {
    setJWT(null);
  }, [memberCredentials]);

  const [members, setMembers] = useState<TrustchainMember[] | null>(null);

  // on live auth or trustchain change, we reset members
  useEffect(() => {
    setMembers(null);
  }, [jwt, trustchain]);

  const mockEnv = useEnv("MOCK");
  const sdk = useMemo(() => getSdk(!!mockEnv, context), [mockEnv, context]);
  const envTrustchainApiIsStg = useEnv("TRUSTCHAIN_API").includes("stg");
  const envWalletSyncApiIsStg = useEnv("CLOUD_SYNC_API").includes("stg");
  const envSummary = mockEnv
    ? "MOCK"
    : envTrustchainApiIsStg && envWalletSyncApiIsStg
      ? "STG"
      : !envTrustchainApiIsStg && !envWalletSyncApiIsStg
        ? "PROD"
        : "MIXED";

  return (
    <TrustchainSDKContext.Provider value={sdk}>
      <Container>
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

          <AppDeviceAuthenticate
            deviceId={deviceId}
            deviceJWT={deviceJWT}
            setDeviceJWT={setDeviceJWT}
          />

          <AppGetOrCreateTrustchain
            deviceId={deviceId}
            deviceJWT={deviceJWT}
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            setTrustchain={setTrustchain}
            setDeviceJWT={setDeviceJWT}
          />

          <AppAuthenticate
            jwt={jwt}
            setJWT={setJWT}
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            deviceJWT={deviceJWT}
          />

          <AppRestoreTrustchain
            jwt={jwt}
            memberCredentials={memberCredentials}
            trustchain={trustchain}
            setTrustchain={setTrustchain}
          />

          <AppGetMembers
            jwt={jwt}
            trustchain={trustchain}
            members={members}
            setMembers={setMembers}
          />

          {members?.map(member => (
            <AppMemberRow
              key={member.id}
              deviceId={deviceId}
              deviceJWT={deviceJWT}
              trustchain={trustchain}
              memberCredentials={memberCredentials}
              member={member}
              setTrustchain={setTrustchain}
              setDeviceJWT={setDeviceJWT}
              setMembers={setMembers}
            />
          ))}

          <AppEncryptUserData trustchain={trustchain} />

          <AppDecryptUserData trustchain={trustchain} />

          <AppDestroyTrustchain
            trustchain={trustchain}
            setTrustchain={setTrustchain}
            setJWT={setJWT}
            setDeviceJWT={setDeviceJWT}
            jwt={jwt}
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
              memberCredentials={memberCredentials}
              version={version}
              setVersion={setWssdkHandledVersion}
            />
          ) : (
            "Please create a trustchain first"
          )}
        </Expand>

        <Tooltip id="tooltip" />
      </Container>
    </TrustchainSDKContext.Provider>
  );
};

export default App;
