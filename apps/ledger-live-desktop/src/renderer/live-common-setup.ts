import "~/live-common-set-supported-currencies";
import "~/live-common-setup-base";
import "./families";

import TransportHttp from "@ledgerhq/hw-transport-http";
import SpeculosHttpTransport, {
  SpeculosHttpTransportOpts,
} from "@ledgerhq/hw-transport-node-speculos-http";
import VaultTransport from "@ledgerhq/hw-transport-vault";
import TransportWebHID from "@ledgerhq/hw-transport-webhid";
import { registerTransportModule } from "@ledgerhq/live-common/hw/index";
import { retry } from "@ledgerhq/live-common/promise";
import { getEnv } from "@ledgerhq/live-env";
import { TraceContext, listen as listenLogs, trace } from "@ledgerhq/logs";
import { getUserId } from "~/helpers/user";
import { setEnvOnAllThreads } from "./../helpers/env";
import logger from "./logger";
import { IPCTransport } from "./IPCTransport";
import { currentMode, setDeviceMode } from "@ledgerhq/live-common/hw/actions/app";
import { getFeature } from "@ledgerhq/live-common/featureFlags/index";
import Transport from "@ledgerhq/hw-transport";

setEnvOnAllThreads("USER_ID", getUserId());

listenLogs(({ id, date, ...log }) => {
  if (log.type !== "hid-frame") {
    logger.debug(log);
  }
});

interface BaseTransportConfig {
  id: string;
  condition: (ldmkFeatureFlag: Feature) => boolean;
  disconnect: () => Promise<void>;
}

interface TransportConfig extends BaseTransportConfig {
  open: (
    id: string,
    timeoutMs?: number,
    context?: TraceContext,
  ) => Promise<Transport> | undefined | null | undefined;
}

function getFeatureValue(key: FeatureId, callback: (...args: unknown[]) => unknown) {
  const value = getFeature({ key });
  if (value?.params?.stale === false) {
    callback(value);
  } else {
    setTimeout(() => getFeatureValue(key, callback), 100);
  }
}

const createTransportModule = (config: TransportConfig, flag: Feature) => {
  if (config.condition(flag)) {
    registerTransportModule({
      id: config.id,
      open: config.open,
      disconnect: config.disconnect,
    });
  }
};

const transportConfigs: TransportConfig[] = [
  {
    id: "speculos-http",
    condition: () => !!getEnv("SPECULOS_API_PORT"),
    open: () => {
      const apiPort: number = getEnv("SPECULOS_API_PORT");
      const opts: Record<string, number> = { apiPort };
      return retry(() => SpeculosHttpTransport.open(opts as SpeculosHttpTransportOpts));
    },
    disconnect: () => Promise.resolve(),
  },
  {
    id: "proxy",
    condition: () => !!getEnv("DEVICE_PROXY_URL"),
    open: () => {
      const proxyUrls = getEnv("DEVICE_PROXY_URL").split("|");
      const transportHttpInstance = TransportHttp(proxyUrls);
      return retry(() => transportHttpInstance.create(3000, 5000));
    },
    disconnect: () => Promise.resolve(),
  },
  {
    id: "web-hid",
    condition: (ldmkFeatureFlag: Feature) => {
      return ldmkFeatureFlag.enabled === true;
    },
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      trace({
        type: "renderer-setup",
        message: "Open called on registered module",
        data: {
          transport: "TransportWebHID",
          timeoutMs,
        },
        context: {
          openContext: context,
        },
      });
      return retry(() => TransportWebHID.create(timeoutMs), { interval: 500, maxRetry: 4 });
    },
    disconnect: () => Promise.resolve(),
  },
  {
    id: "ipc",
    condition: ldmkFeatureFlag => {
      // legacy transport
      return ldmkFeatureFlag.enabled === false;
    },
    open: (id: string, timeoutMs?: number, context?: TraceContext) => {
      const originalDeviceMode = currentMode;
      const vaultTransportPrefixID = "vault-transport:";
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
      return retry(() => IPCTransport.open(id, timeoutMs, context), {
        interval: 500,
        maxRetry: 4,
      });
    },
    disconnect: () => Promise.resolve(),
  },
  {
    id: "vault-transport",
    condition: () => {
      return true;
    },
    open: (id: string) => {
      const vaultTransportPrefixId = "vault-transport:";
      if (!id.startsWith(vaultTransportPrefixId)) {
        return Promise.reject(new Error("Invalid vault transport ID"));
      }
      setDeviceMode("polling");
      const params = new URLSearchParams(id.replace(vaultTransportPrefixId, ""));
      return retry(() =>
        VaultTransport.open(params.get("host") as string).then(transport => {
          transport.setData({
            token: params.get("token") as string,
            workspace: params.get("workspace") as string,
          });
          return transport;
        }),
      );
    },
    disconnect: () => Promise.resolve(),
  },
];

// Register transport modules
getFeatureValue("ldmkTransport", (flag: Feature) => {
  transportConfigs.forEach(config => {
    createTransportModule(config, flag);
  });
});
