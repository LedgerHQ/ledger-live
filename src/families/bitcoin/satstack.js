// @flow
import { Observable, interval, from } from "rxjs";
import url from "url";
import { share, switchMap } from "rxjs/operators";
import { SatStackNotReady } from "../../errors";
import { getCryptoCurrencyById } from "../../currencies";
import network from "../../network";
import { RPCFieldRequired } from "../../errors";
import type { AccountDescriptor } from "./descriptor";
import { getEnv } from "../../env";
import { getCurrencyExplorer } from "../../api/Ledger";

let mockStatus: SatStackStatus = { type: "ready" };
export function setMockStatus(s: SatStackStatus) {
  mockStatus = s;
}

export type RPCNodeConfig = {
  host: string,
  username: string,
  password: string,
  tls?: boolean,
};

export function isValidHost(host: string) {
  const splits = host.split(":");
  if (splits.length > 2) return false;
  // domainToASCII returns "" when a domain is invalid
  return Boolean(url.domainToASCII(splits[0]));
}

// we would call this only during the user validation of the rpc node configuration
export function validateRPCNodeConfig(
  config: RPCNodeConfig
): Array<{ field: string, error: Error }> {
  const errors = [];
  if (!config.host || !isValidHost(config.host)) {
    errors.push({
      field: "host",
      error: new RPCFieldRequired("invalid host"),
    });
  }
  if (!config.username) {
    errors.push({
      field: "username",
      error: new RPCFieldRequired("invalid username"),
    });
  }
  if (!config.password) {
    errors.push({
      field: "password",
      error: new RPCFieldRequired("invalid password"),
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
    auth: { username, password },
  });
}

export type SatStackConfig = {
  node: RPCNodeConfig,
  accounts: Array<{
    descriptor: AccountDescriptor,
    extra?: Object, // user's unknown fields are preserved in this
  }>,
  extra?: Object, // user's unknown fields are preserved in this
};

// we would need to call this any time we would "Edit" the flow
export function parseSatStackConfig(json: string): ?SatStackConfig {
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
        .filter(Boolean);
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
  edit: $Shape<SatStackConfig>
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
    ...edit, // edit is patching existing fields
    accounts,
  };
}

export type SatStackStatus =
  | { type: "satstack-disconnected" }
  | { type: "node-disconnected" }
  | { type: "invalid-chain", found: string }
  | { type: "initializing" }
  | { type: "syncing", progress: number } // progress percentage from 0 to 1
  | { type: "scanning", progress: number } // progress percentage from 0 to 1
  | { type: "ready" };

export function isSatStackEnabled(): boolean {
  return getEnv("SATSTACK");
}

// We would need it any time we want to check if the Sats Stack is up and what status is it at currently
// - during the configuration flow (on last step) (actively polling)
// - on the settings screen (actively polling)
// - before doing a sync
// - before doing an add account
// NB the promise is never rejected
export async function fetchSatStackStatus(): Promise<SatStackStatus> {
  if (!isSatStackEnabled()) {
    return { type: "satstack-disconnected" };
  }

  if (getEnv("MOCK")) {
    return mockStatus;
  }

  const { endpoint, version } = getCurrencyExplorer(
    getCryptoCurrencyById("bitcoin")
  );

  const r = await network({
    type: "GET",
    url: `${endpoint}/blockchain/${version}/explorer/status`,
  }).catch(() => null);
  if (!r || !r.data) {
    return { type: "satstack-disconnected" };
  }
  const { chain, status, sync_progress, scan_progress } = r.data;
  if (chain !== "main") {
    return { type: "invalid-chain", found: chain };
  }

  if (status === "initializing") {
    return { type: "initializing" };
  }

  if (status === "node-disconnected") {
    return { type: "node-disconnected" };
  }

  if (status === "syncing") {
    return { type: "syncing", progress: (sync_progress || 0) / 100 };
  }

  if (status === "scanning") {
    return { type: "scanning", progress: (scan_progress || 0) / 100 };
  }

  return { type: "ready" };
}

export async function requiresSatStackReady() {
  if (isSatStackEnabled()) {
    const status = await fetchSatStackStatus();
    if (status.type !== "ready") {
      throw new SatStackNotReady();
    }
  }
}

export const statusObservable: Observable<SatStackStatus> = interval(1000).pipe(
  switchMap(() => from(fetchSatStackStatus())),
  share()
);
