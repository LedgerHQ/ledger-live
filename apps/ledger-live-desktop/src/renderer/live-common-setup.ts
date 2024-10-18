import "~/live-common-setup-base";
import "~/live-common-set-supported-currencies";
import "./families";

import VaultTransport from "@ledgerhq/hw-transport-vault";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { TraceContext, listen as listenLogs, trace } from "@ledgerhq/logs";
import { getUserId } from "~/helpers/user";
import { setEnvOnAllThreads } from "./../helpers/env";
import { IPCTransport } from "./IPCTransport";
import logger from "./logger";
import { currentMode, setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { getFeature } from "@ledgerhq/live-common/featureFlags/index";
import { FeatureId } from "@ledgerhq/types-live";
import { getEnv } from "@ledgerhq/live-env";
import { overriddenFeatureFlagsSelector } from "~/renderer/reducers/settings";
import { State } from "./reducers";

interface Store {
  getState: () => State;
}

const getFeatureWithOverrides = (key: FeatureId, store: Store) => {
  const state = store.getState();
  const localOverrides = overriddenFeatureFlagsSelector(state);
  return getFeature({ key, localOverrides });
};

export function registerTransportModules(store: Store) {
  setEnvOnAllThreads("USER_ID", getUserId());
  const vaultTransportPrefixID = "vault-transport:";
  const isSpeculosEnabled = !!getEnv("SPECULOS_API_PORT");
  const isProxyEnabled = !!getEnv("DEVICE_PROXY_URL");

  listenLogs(({ id, date, ...log }) => {
    if (log.type === "hid-frame") return;
    logger.debug(log);
  });

  // Register IPC Transport Module
  registerTransportModule({
    id: "ipc",
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      const ldmkFeatureFlag = getFeatureWithOverrides("ldmkTransport" as FeatureId, store);
      if (ldmkFeatureFlag.enabled === true && !isSpeculosEnabled && !isProxyEnabled) return;

      const originalDeviceMode = currentMode;
      // id could be another type of transport such as vault-transport
      if (id.startsWith(vaultTransportPrefixID)) return;

      if (originalDeviceMode !== currentMode) {
        setDeviceMode(originalDeviceMode);
      }

      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "IPCTransport",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });

      // Retries in the `renderer` process if the open failed. No retry is done in the `internal` process to avoid multiplying retries.
      return retry(() => IPCTransport.open(id, timeoutMs, context), {
        interval: 500,
        maxRetry: 4,
      });
    },
    disconnect: () => Promise.resolve(),
  });

  // Register Vault Transport Module
  registerTransportModule({
    id: "vault-transport",
    open: (id: string) => {
      if (!id.startsWith(vaultTransportPrefixID)) return;
      setDeviceMode("polling");
      const params = new URLSearchParams(id.split(vaultTransportPrefixID)[1]);
      return retry(() =>
        VaultTransport.open(params.get("host") as string).then(transport => {
          transport.setData({
            token: params.get("token") as string,
            workspace: params.get("workspace") as string,
          });
          return Promise.resolve(transport);
        }),
      );
    },
    disconnect: () => Promise.resolve(),
  });
}
