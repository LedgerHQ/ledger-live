import "./dev-tools-setup"; // registers WebHID transport module
import { useCallback, useMemo, useSyncExternalStore } from "react";
import { useDispatch } from "react-redux";
import { ThemeProvider } from "@ledgerhq/lumen-ui-react";
import { getSdk } from "@ledgerhq/ledger-key-ring-protocol/index";
import {
  setTrustchain,
  setMemberCredentials,
  resetTrustchainStore,
} from "@ledgerhq/ledger-key-ring-protocol/store";
import { withDevice } from "@ledgerhq/live-common/hw/deviceAccess";
import { DevTools, type DevToolsConfig } from "@devtools/shell";
import {
  useFeatureFlagsToolProps,
  useEnvDevToolProps,
  useProdToggle,
  useTrustchainDevToolProps,
  useCloudSyncDevToolProps,
} from "@devtools/bindings";
import type { Trustchain, MemberCredentials } from "@ledgerhq/ledger-key-ring-protocol/types";
import { TransportPanel } from "@devtools/transport-panel";
import {
  buildTransport,
  buildCopyStoreProtocol,
  buildRetrieveConnectedDevicesProtocol,
  combineProtocols,
} from "@devtools/wire";
import { store } from "../store";
import { sleepingListener } from "../store/sleepingListener";
import { useConnectedDevices, setDevices } from "../store/useConnectedDevices";

// Use 127.0.0.1 (not "localhost") to match the relay's IPv4 bind — on macOS
const HUB_URL = "ws://127.0.0.1:9090";
const ROLE = "tool" as const;
const APPLICATION_ID = 16;

export const wire = buildTransport(
  { hubUrl: HUB_URL, role: ROLE, id: "web-tools", target: "desktop" },
  combineProtocols(
    buildCopyStoreProtocol(store, sleepingListener, ROLE),
    buildRetrieveConnectedDevicesProtocol(setDevices),
  ),
);

export default function DevToolsPage() {
  const dispatch = useDispatch();
  const devices = useConnectedDevices();
  const featureFlagsProps = useFeatureFlagsToolProps();
  const envProps = useEnvDevToolProps();
  const prodToggle = useProdToggle();

  const createTrustchainSdk = useCallback<Parameters<typeof useTrustchainDevToolProps>[0]>(
    ({ trustchainApiBaseUrl }) =>
      getSdk(
        false,
        { applicationId: APPLICATION_ID, name: "DevTools", apiBaseUrl: trustchainApiBaseUrl },
        withDevice,
      ),
    [],
  );

  const createCloudSyncSdk = useCallback<Parameters<typeof useCloudSyncDevToolProps>[0]>(
    ({ trustchainApiBaseUrl }) =>
      getSdk(
        false,
        { applicationId: APPLICATION_ID, name: "DevTools", apiBaseUrl: trustchainApiBaseUrl },
        withDevice,
      ),
    [],
  );

  const onTrustchainChange = useCallback(
    (tc: Trustchain | null) => {
      if (tc !== null) dispatch(setTrustchain(tc));
      // null = devtool cleared trustchain locally; no Redux dispatch to avoid
      // silently rotating memberCredentials via resetTrustchainStore.
    },
    [dispatch],
  );

  const onMemberCredentialsChange = useCallback(
    (mc: MemberCredentials | null) => {
      if (mc !== null) dispatch(setMemberCredentials(mc));
      else dispatch(resetTrustchainStore());
    },
    [dispatch],
  );

  const trustchainProps = useTrustchainDevToolProps(
    createTrustchainSdk,
    prodToggle.trustchainApiBaseUrl,
    onTrustchainChange,
    onMemberCredentialsChange,
    prodToggle.useProd,
    prodToggle.setUseProd,
  );

  const cloudSyncProps = useCloudSyncDevToolProps(
    createCloudSyncSdk,
    prodToggle.cloudSyncApiBaseUrl,
    prodToggle.trustchainApiBaseUrl,
    prodToggle.useProd,
    prodToggle.setUseProd,
  );

  const config: DevToolsConfig = useMemo(
    () => [
      { id: "feature-flags", config: featureFlagsProps },
      { id: "env", config: envProps },
      { id: "trustchain", config: trustchainProps },
      { id: "cloud-sync", config: cloudSyncProps },
    ],
    [featureFlagsProps, envProps, trustchainProps, cloudSyncProps],
  );
  const wireState = useSyncExternalStore(wire.subscribe, wire.getState, wire.getState);

  return (
    <ThemeProvider colorScheme="system">
      <div style={{ height: "100vh" }}>
        <DevTools
          config={config}
          footer={
            <TransportPanel
              transport={wire.transport}
              hubUrl={wireState.hubUrl}
              setHubUrl={wire.setHubUrl}
              role={wireState.role}
              target={wireState.target}
              setTarget={wire.setTarget}
              devices={devices}
            />
          }
        />
      </div>
    </ThemeProvider>
  );
}
