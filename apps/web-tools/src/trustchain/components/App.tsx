import React, { Suspense, useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ThemeProvider,
  Tag,
  Tooltip,
  TooltipTrigger,
  TooltipContent,
} from "@ledgerhq/lumen-ui-react";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import {
  MemberCredentials,
  Trustchain,
  TrustchainMember,
} from "@ledgerhq/ledger-key-ring-protocol/types";
import { getInitialStore } from "@ledgerhq/ledger-key-ring-protocol/store";
import useEnv from "../useEnv";
import Expand from "./Expand";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol";
import { DisplayName, IdentityManager } from "./IdentityManager";
import { AppSetDeviceId } from "./AppSetDeviceId";
import { AppSetSupportedCurrencies } from "./AppSetSupportedCurrencies";
import { AppSetApplicationId } from "./AppSetApplicationId";
import { AppQRCodeCandidate } from "./AppQRCodeCandidate";
import { TrustchainSDKContext, defaultContext } from "../context";
import { DeviceInteractionVisibleContext } from "../deviceInteractionContext";
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

const initialState: State = {
  accounts: [],
  nonImportedAccounts: [],
  walletState: walletInitialState,
};

// applicationPath is m/0'/<applicationId>'/<index>'
const applicationIdOfPath = (applicationPath: string): number =>
  parseInt(applicationPath.split("/")[2], 10);

const App = () => {
  const [context, setContext] = useState(defaultContext);
  const [deviceId, setDeviceId] = useState<string>("webhid");
  const [selectedApplicationId, setSelectedApplicationId] = useState<number>(
    defaultContext.applicationId,
  );

  const [trustchainState, setTrustchainState] = useState(getInitialStore);
  const { memberCredentials, trustchain } = trustchainState;
  const setMemberCredentials = useCallback(
    (memberCredentials: MemberCredentials | null) =>
      setTrustchainState(_state => ({ jwt: null, trustchain: null, memberCredentials })),
    [],
  );
  const lkrpApiBaseUrl = useEnv("TRUSTCHAIN_API_STAGING");
  const cloudSyncApiBaseUrl = useEnv("CLOUD_SYNC_API_STAGING");
  const setTrustchain = useCallback(
    (trustchain: Trustchain | null) => setTrustchainState(s => ({ ...s, trustchain })),
    [],
  );

  // A loaded trustchain owns its applicationId; the selection only applies when none is loaded.
  const applicationId = trustchain
    ? applicationIdOfPath(trustchain.applicationPath)
    : selectedApplicationId;
  const setApplicationId = useCallback(
    (id: number) => {
      setSelectedApplicationId(id);
      if (trustchain && applicationIdOfPath(trustchain.applicationPath) !== id) {
        setTrustchain(null);
      }
    },
    [trustchain, setTrustchain],
  );

  const [state, setState] = useState<State>(initialState);

  const accountsSyncControl = useState<boolean>(false);
  const [accountsSync, setAccountsSync] = accountsSyncControl;

  const takeControl = useCallback(() => {
    setAccountsSync(false);
  }, [setAccountsSync]);

  const [wssdkHandledVersion, setWssdkHandledVersion] = useState(0);
  const [wssdkHandledData, setWssdkHandledData] = useState<DistantState | null>(null);

  const version = state.walletState.walletSyncState.version || wssdkHandledVersion;
  const data = state.walletState.walletSyncState.data || wssdkHandledData;

  const wsStateRef = useRef({ version, data });
  useEffect(() => {
    wsStateRef.current = { version, data };
  }, [version, data]);

  const [members, setMembers] = useState<TrustchainMember[] | null>(null);

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

  const lkrpContext = useMemo(
    () => ({ ...context, applicationId, apiBaseUrl: lkrpApiBaseUrl }),
    [context, applicationId, lkrpApiBaseUrl],
  );
  const sdk = useMemo(
    () => getSdk(!!mockEnv, lkrpContext, withDevice, lifecycle),
    [mockEnv, lkrpContext, memberCredentials],
  );
  const envTrustchainApiIsStg = lkrpApiBaseUrl.includes("stg");
  const envWalletSyncApiIsStg = cloudSyncApiBaseUrl.includes("stg");
  const envSummary = mockEnv
    ? "MOCK"
    : envTrustchainApiIsStg && envWalletSyncApiIsStg
      ? "STG"
      : !envTrustchainApiIsStg && !envWalletSyncApiIsStg
        ? "PROD"
        : "MIXED";

  // Cloud Sync and Accounts Sync are Ledger Sync-only; other apps (e.g. ring) use the Trustchain SDK only.
  const isLedgerSync = applicationId === defaultContext.applicationId;

  const [deviceInteractionVisible, setDeviceInteractionVisible] = useState(false);
  const callbacks = useMemo(
    () => ({
      onStartRequestUserInteraction: () => setDeviceInteractionVisible(true),
      onEndRequestUserInteraction: () => setDeviceInteractionVisible(false),
    }),
    [],
  );

  return (
    <ThemeProvider colorScheme="light">
      <TrustchainSDKContext.Provider value={sdk}>
        <DeviceInteractionVisibleContext.Provider value={deviceInteractionVisible}>
          <div className="mx-auto flex w-full max-w-6xl flex-col bg-canvas px-10 pb-48 min-h-screen">
            <DeviceInteractionLayer visible={deviceInteractionVisible} />

            <h2 className="heading-3 my-24 text-base">Wallet Sync Trustchain Playground</h2>

            <Expand
              title={
                <>
                  <Tooltip>
                    <TooltipTrigger>
                      <span>Identities</span>
                    </TooltipTrigger>
                    <TooltipContent>
                      Simulates different Live instances. Persisted states shared between browser
                      tabs.
                    </TooltipContent>
                  </Tooltip>{" "}
                  <span className="body-2 text-muted">
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
                  <span>Environment</span> <Tag size="sm" label={envSummary} />{" "}
                  <Tag size="sm" label={`app ${applicationId}`} />
                </>
              }
            >
              <AppSetTrustchainAPIEnv />
              <AppSetCloudSyncAPIEnv />
              <AppMockEnv />
              <AppSetSupportedCurrencies />
              <AppSetApplicationId
                applicationId={applicationId}
                setApplicationId={setApplicationId}
              />
              <AppSetDeviceId deviceId={deviceId} setDeviceId={setDeviceId} />
            </Expand>

            <Expand
              title={
                <>
                  <span>Trustchain SDK</span>{" "}
                  {trustchain ? (
                    <code className="body-3 text-muted">
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
                  trustchain={trustchain}
                />
              </Expand>
            </Expand>

            {isLedgerSync ? (
              <>
                <Expand
                  title={
                    <>
                      <span>Cloud Sync SDK</span>{" "}
                      {version ? (
                        <code className="body-3 text-muted">Version: {version}</code>
                      ) : null}
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
                    <p className="body-2 text-muted">Please create a trustchain first</p>
                  )}
                </Expand>

                <Expand title="Accounts Sync" dynamicControl={accountsSyncControl}>
                  {trustchain && memberCredentials ? (
                    <Suspense fallback={<Loading />}>
                      <AppAccountsSync
                        deviceId={deviceId}
                        trustchain={trustchain}
                        memberCredentials={memberCredentials}
                        state={state}
                        setState={setState}
                        setTrustchain={setTrustchain}
                      />
                    </Suspense>
                  ) : (
                    <p className="body-2 text-muted">Please create a trustchain first</p>
                  )}
                </Expand>
              </>
            ) : (
              <p className="body-2 my-12 text-muted">
                Cloud Sync SDK and Accounts Sync are Ledger Sync (application{" "}
                {defaultContext.applicationId}) features. Switch the application back to{" "}
                {defaultContext.applicationId} in the Environment section to use them.
              </p>
            )}
          </div>
        </DeviceInteractionVisibleContext.Provider>
      </TrustchainSDKContext.Provider>
    </ThemeProvider>
  );
};

const AppAccountsSync = React.lazy(
  () => import("./AppAccountsSync.js") as unknown as Promise<{ default: React.ComponentType<any> }>,
);

export default App;
