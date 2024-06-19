import React, { useCallback, useEffect, useMemo, useState } from "react";
import styled from "styled-components";
import { Tooltip } from "react-tooltip";
import { JWT, MemberCredentials, Trustchain, TrustchainMember } from "@ledgerhq/trustchain/types";
import { getInitialStore } from "@ledgerhq/trustchain/store";
import useEnv from "../useEnv";
import Expand from "./Expand";
import { getSdk } from "@ledgerhq/trustchain";
import { DisplayName, IdentityManager } from "./IdentityManager";
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
import { AppWalletSync } from "./AppWalletSync";
import { AppSetCloudSyncAPIEnv } from "./AppSetCloudSyncAPIEnv";

const Container = styled.div`
  padding: 0 10px;
  margin: 0 auto;
  max-width: 800px;
  display: flex;
  flex-direction: column;
`;

const App = () => {
  const [context, setContext] = useState(defaultContext);
  const [deviceJWT, setDeviceJWT] = useState<JWT | null>(null);

  // this is the state as it will be used by Ledger Live
  const [state, setState] = useState(getInitialStore);
  const { memberCredentials, trustchain } = state;
  const setMemberCredentials = useCallback(
    (memberCredentials: MemberCredentials | null) =>
      setState(s => ({ trustchain: null, memberCredentials })),
    [],
  );
  const setTrustchain = useCallback(
    (trustchain: Trustchain | null) => setState(s => ({ ...s, trustchain })),
    [],
  );

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
  const envWalletSyncApiIsStg = useEnv("WALLET_SYNC_API").includes("stg");
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
                <DisplayName pubkey={state.memberCredentials?.pubkey} />
              </span>
            </>
          }
        >
          <IdentityManager
            state={state}
            setState={setState}
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

          <AppDeviceAuthenticate deviceJWT={deviceJWT} setDeviceJWT={setDeviceJWT} />

          <AppGetOrCreateTrustchain
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

        <Expand title="Wallet Sync" expanded={!!trustchain}>
          {trustchain && memberCredentials ? (
            <AppWalletSync trustchain={trustchain} memberCredentials={memberCredentials} />
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
