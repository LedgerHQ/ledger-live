import { log } from "@ledgerhq/logs";
import { Observable, interval, from } from "rxjs";
import semver from "semver";
import { share, switchMap, filter } from "rxjs/operators";
import {
  SatStackVersionTooOld,
  SatStackAccessDown,
  SatStackStillSyncing,
  RPCHostRequired,
  RPCUserRequired,
  RPCPassRequired,
  RPCHostInvalid,
} from "../../errors";
import { getCryptoCurrencyById } from "../../currencies";
import network from "../../network";
import type { AccountDescriptor } from "./descriptor";
import { getEnv } from "../../env";
import { getCurrencyExplorer } from "../../api/Ledger";
const minVersionMatch = ">=0.11.1";

function isAcceptedVersion(version: string | null | undefined) {
  return (
    !!version && semver.satisfies(semver.coerce(version) || "", minVersionMatch)
  );
}

let mockStatus: SatStackStatus = {
  type: "ready",
};
export function setMockStatus(s: SatStackStatus): void {
  mockStatus = s;
}
export type RPCNodeConfig = {
  host: string;
  username: string;
  password: string;
  tls?: boolean;
};

export function isValidHost(host: string): boolean {
  const pattern = new RegExp(
    "^" + // beginning of url
      "(((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,})|^[a-z\\d-]{2,}|" + // domain name
      "((\\d{1,3}\\.){3}\\d{1,3}))" + // OR ip (v4) address
      "(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*$"
  ); // port and path
  return !!pattern.test(host);
}

// we would call this only during the user validation of the rpc node configuration
export function validateRPCNodeConfig(config: RPCNodeConfig): Array<{
  field: string;
  error: Error;
}> {
  const errors: Array<{ field: string; error: Error }> = [];

  if (!config.host) {
    errors.push({
      field: "host",
      error: new RPCHostRequired(),
    });
  } else if (!isValidHost(config.host)) {
    errors.push({
      field: "host",
      error: new RPCHostInvalid(),
    });
  }

  if (!config.username) {
    errors.push({
      field: "username",
      error: new RPCUserRequired(),
    });
  }

  if (!config.password) {
    errors.push({
      field: "password",
      error: new RPCPassRequired(),
    });
  }

  return errors;
}
// we would call this only during the "Testing node connection" step
// Check if the node is accessible by RPC. promise fails if not.
export async function checkRPCNodeConfig(config: RPCNodeConfig): Promise<void> {
  const errors = validateRPCNodeConfig(config);

  if (errors.length) {
    throw errors[0].error;
  }

  if (getEnv("MOCK")) {
    if (mockStatus.type === "node-disconnected") {
      throw new Error("mock disconnected");
    }

    return;
  }

  const { host, username, password, tls } = config;
  await network({
    url: `http${tls ? "s" : ""}://${host}`,
    method: "POST",
    data: {
      jsonrpc: "1.0",
      id: "ledger-live-full-node-check",
      method: "getblockchaininfo",
      params: [],
    },
    auth: {
      username,
      password,
    },
  });
}
export type SatStackConfig = {
  node: RPCNodeConfig;
  accounts: Array<{
    descriptor: AccountDescriptor;
    extra?: Record<string, any>; // user's unknown fields are preserved in this
  }>;
  extra?: Record<string, any>; // user's unknown fields are preserved in this
};
// we would need to call this any time we would "Edit" the flow
export function parseSatStackConfig(
  json: string
): SatStackConfig | null | undefined {
  const obj = JSON.parse(json);

  if (obj && typeof obj === "object") {
    const { accounts, rpcurl, rpcuser, rpcpass, notls, ...extra } = obj;
    if (!rpcurl || typeof rpcurl !== "string") return;
    if (!rpcuser || typeof rpcuser !== "string") return;
    if (!rpcpass || typeof rpcpass !== "string") return;
    const result: SatStackConfig = {
      node: {
        host: rpcurl,
        username: rpcuser,
        password: rpcpass,
        tls: !notls,
      },
      accounts: [],
      extra,
    };

    if (accounts && typeof accounts === "object" && Array.isArray(accounts)) {
      result.accounts = accounts
        .map((a) => {
          const { external, internal, ...extra } = a;
          if (!external || typeof external !== "string") return;
          if (!internal || typeof internal !== "string") return;
          return {
            descriptor: {
              external,
              internal,
            },
            extra,
          };
        })
        .filter(Boolean) as Array<{
        descriptor: AccountDescriptor;
        extra: Record<string, any> | undefined;
      }>;
    }

    return result;
  }
}
// we would need this at the end of the setup flow, when we save to a jss.json configuration file
export function stringifySatStackConfig(config: SatStackConfig): string {
  return JSON.stringify(
    {
      accounts: config.accounts.map((a) => ({
        external: a.descriptor.external,
        internal: a.descriptor.internal,
        ...a.extra,
      })),
      rpcurl: config.node.host,
      rpcuser: config.node.username,
      rpcpass: config.node.password,
      notls: !config.node.tls,
      ...config.extra,
    },
    null,
    2
  );
}
// We would need it to apply an edition over an existing sats stack configuration (before saving it over)
export function editSatStackConfig(
  existing: SatStackConfig,
  edit: Partial<SatStackConfig>
): SatStackConfig {
  const accounts = existing.accounts.concat(
    // append accounts that would not already exist
    (edit.accounts || []).filter(
      (a) =>
        !existing.accounts.some(
          (existing) => a.descriptor.internal === existing.descriptor.internal
        )
    )
  );
  return {
    ...existing,
    ...edit,
    // edit is patching existing fields
    accounts,
  };
}
export type SatStackStatus =
  | {
      type: "satstack-outdated";
    }
  | {
      type: "satstack-disconnected";
    }
  | {
      type: "node-disconnected";
    }
  | {
      type: "invalid-chain";
      found: string;
    }
  | {
      type: "initializing";
    }
  | {
      type: "syncing";
      progress: number;
    } // progress percentage from 0 to 1
  | {
      type: "scanning";
      progress: number;
    } // progress percentage from 0 to 1
  | {
      type: "ready";
    };
export function isSatStackEnabled(): boolean {
  return Boolean(getEnv("SATSTACK"));
}
// We would need it any time we want to check if the Sats Stack is up and what status is it at currently
// - during the configuration flow (on last step) (actively polling)
// - on the settings screen (actively polling)
// - before doing a sync
// - before doing an add account
// NB the promise is never rejected
export async function fetchSatStackStatus(): Promise<SatStackStatus> {
  if (!isSatStackEnabled()) {
    return {
      type: "satstack-disconnected",
    };
  }

  if (getEnv("MOCK")) {
    return mockStatus;
  }

  const ce = getCurrencyExplorer(getCryptoCurrencyById("bitcoin"));
  const r = await network({
    method: "GET",
    url: `${ce.endpoint}/blockchain/${ce.version}/explorer/status`,
  }).catch(() => null);

  if (!r || !r.data) {
    return {
      type: "satstack-disconnected",
    };
  }

  const { chain, status, sync_progress, scan_progress, version } = r.data;

  if (!isAcceptedVersion(version)) {
    return {
      type: "satstack-outdated",
    };
  }

  if (chain !== "main") {
    return {
      type: "invalid-chain",
      found: chain,
    };
  }

  if (status === "initializing" || status === "pending-scan") {
    return {
      type: "initializing",
    };
  }

  if (status === "node-disconnected") {
    return {
      type: "node-disconnected",
    };
  }

  if (status === "syncing") {
    return {
      type: "syncing",
      progress: (sync_progress || 0) / 100,
    };
  }

  if (status === "scanning") {
    return {
      type: "scanning",
      progress: (scan_progress || 0) / 100,
    };
  }

  return {
    type: "ready",
  };
}
export async function checkDescriptorExists(
  descriptor: string
): Promise<boolean> {
  if (getEnv("MOCK")) {
    return true;
  }

  const r = await network({
    method: "POST",
    url: `${getEnv("EXPLORER_SATSTACK")}/control/descriptors/has`,
    data: {
      descriptor,
    },
  });
  log(
    "satstack",
    "checkDescriptorExists " + descriptor + " is " + r.data.exists
  );
  return Boolean(r.data.exists);
}
export async function requiresSatStackReady(): Promise<void> {
  if (isSatStackEnabled()) {
    const status = await fetchSatStackStatus();

    switch (status.type) {
      case "ready":
        return;

      case "syncing":
      case "scanning":
        throw new SatStackStillSyncing();

      case "satstack-outdated":
        throw new SatStackVersionTooOld();

      default:
        throw new SatStackAccessDown();
    }
  }
}
export const statusObservable: Observable<SatStackStatus> = interval(1000).pipe(
  switchMap(() => from(fetchSatStackStatus())),
  filter((e, i) => i > 4 || e.type !== "satstack-disconnected"),
  share()
);
