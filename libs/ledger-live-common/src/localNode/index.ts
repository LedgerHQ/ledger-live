import { getCryptoCurrencyById } from "@domain/entity-currency-crypto";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

/** coin-sandbox's server (`deno task server`): it lists the running chains and airdrops on them. */
export const LOCAL_NODE_SERVER_URL = "http://localhost:8000";

/**
 * A chain of coin-sandbox, as `GET /<family>/chains` lists it: `network` is the currency id, and
 * its family gives each port a role (`rpc`, `api`, `ui`...).
 */
export type LocalChain = {
  family: string;
  network: string;
  status: string;
  rpc?: number;
  api?: number;
  ui?: number;
  ws?: number;
};

type Endpoints = Record<string, unknown>;

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

const isLocal = (url: unknown): boolean => {
  try {
    return typeof url === "string" && LOCAL_HOSTS.has(new URL(url).hostname);
  } catch {
    return false;
  }
};

/** Every URL in `value`, at any depth, with the path of the field holding it. */
const urlsIn = (value: unknown, field = ""): { field: string; url: string }[] => {
  if (typeof value === "string") return /^[a-z]+:\/\//i.test(value) ? [{ field, url: value }] : [];
  if (value && typeof value === "object") {
    return Object.entries(value).flatMap(([key, item]) =>
      urlsIn(item, field ? `${field}.${key}` : key),
    );
  }
  return [];
};

const localUrl = (chain: LocalChain, role: "rpc" | "api" | "ui", path = ""): string => {
  const port = chain[role];
  if (typeof port !== "number") {
    throw new Error(`coin-sandbox lists no ${role} port for ${chain.network}`);
  }
  return `http://localhost:${port}${path}`;
};

/**
 * Which fields of a currency's configuration point at its network, by family, and what they become
 * on its local chain. Every other field keeps its value (defaults, Firebase, overrides); a field
 * set to `undefined` is removed.
 */
const LOCAL_ENDPOINTS: Readonly<Record<string, (chain: LocalChain) => Endpoints>> = {
  // Atlas has no UI, Blockscout does. An Atlas chain keeps its `ledger` node, explorer and gas
  // tracker, and their explorerId: only their base URL moves. A Blockscout chain replaces them.
  evm: chain =>
    chain.ui === undefined
      ? { ledgerExplorerUri: localUrl(chain, "api") }
      : {
          node: { type: "external", uri: localUrl(chain, "rpc") },
          explorer: { type: "blockscout", uri: localUrl(chain, "api", "/api") },
          gasTracker: undefined,
          ledgerExplorerUri: undefined,
        },
  // Without rpcUrls.solana, coin-solana falls back to Ledger's mainnet proxy (API_SOLANA_PROXY),
  // a URL no configuration shows. The validator list is mainnet's: without its URL, there is none.
  solana: chain => ({ rpcUrls: { solana: localUrl(chain, "rpc") }, validatorsUrl: undefined }),
  xrp: chain => ({ node: localUrl(chain, "rpc") }),
  // Energy rental is a mainnet service: without its settings, coin-tron turns it off
  tron: chain => ({ explorer: { url: localUrl(chain, "api") }, energyRent: undefined }),
};

let localNodeCurrencies: ReadonlySet<string> = new Set();
let localChains: ReadonlyMap<string, { chain: LocalChain; endpoints: Endpoints }> = new Map();

/**
 * Selects the currencies that run on their local node instead of their default network; their
 * chains are then read by `loadLocalNodes`.
 *
 * Called once by the app at boot, before any bridge is used: coin modules cache per chain id, so
 * switching a currency that already synced against its default network would mix both.
 */
export function setLocalNodeCurrencies(currencyIds: Iterable<string>): void {
  localNodeCurrencies = new Set(currencyIds);
  localChains = new Map();
}

export function getLocalNodeCurrencies(): string[] {
  return [...localNodeCurrencies];
}

async function fetchChains(serverUrl: string, family: string): Promise<LocalChain[]> {
  const url = `${serverUrl}/${family}/chains`;
  let response: Response;
  try {
    response = await fetch(url);
  } catch (error) {
    throw new Error(
      `Cannot reach coin-sandbox's server at ${serverUrl} (${error instanceof Error ? error.message : String(error)}): start it, deno task server`,
    );
  }
  if (!response.ok)
    throw new Error(`coin-sandbox runs no ${family} chain (${url}: HTTP ${response.status})`);
  return response.json();
}

/**
 * Reads where the selected currencies' chains run from coin-sandbox's server. Throws when the
 * server is down, has no chain for one of them, or Ledger Live cannot run its family locally:
 * until it succeeds, their configuration is refused rather than left on their default network.
 */
export async function loadLocalNodes(serverUrl: string = LOCAL_NODE_SERVER_URL): Promise<void> {
  const currencyIds = [...localNodeCurrencies];
  if (!currencyIds.length) return;

  const families = new Map(currencyIds.map(id => [id, getCryptoCurrencyById(id).family]));
  const unsupported = currencyIds.filter(id => !LOCAL_ENDPOINTS[families.get(id) ?? ""]);
  if (unsupported.length) {
    throw new Error(
      `Ledger Live cannot run ${unsupported.join(", ")} on a local node. Supported families: ${Object.keys(LOCAL_ENDPOINTS).join(", ")}`,
    );
  }

  const chains = (
    await Promise.all([...new Set(families.values())].map(family => fetchChains(serverUrl, family)))
  ).flat();
  const loaded = new Map(
    currencyIds.map(id => {
      const chain = chains.find(({ network }) => network === id);
      if (!chain) throw new Error(`coin-sandbox has no chain for ${id}`);
      return [id, { chain, endpoints: LOCAL_ENDPOINTS[chain.family](chain) }];
    }),
  );

  localChains = loaded;
  try {
    // Refuse at boot, rather than at the first sync, a configuration that would leave the machine
    currencyIds.forEach(getLocalNodeConfig);
  } catch (error) {
    localChains = new Map();
    throw error;
  }
}

/** The local chain of `currencyId`, `undefined` unless it runs on its local node. */
export function getLocalNodeChain(currencyId: string): LocalChain | undefined {
  return localNodeCurrencies.has(currencyId) ? localChains.get(currencyId)?.chain : undefined;
}

/**
 * The configuration of `currencyId` when it runs on its local node, `undefined` when it runs on
 * its default network: its usual configuration (defaults, Firebase, overrides) with its endpoints
 * moved to its local chain. Throws rather than return a configuration that could reach anything
 * but this machine, or while a selected currency's chain is not loaded.
 */
export function getLocalNodeConfig(currencyId: string): CurrencyConfig | undefined {
  if (!localNodeCurrencies.has(currencyId)) return undefined;
  const local = localChains.get(currencyId);
  if (!local) {
    throw new Error(
      `The local node of ${currencyId} is not loaded: is coin-sandbox's server running?`,
    );
  }

  const usual: (CurrencyConfig & Record<string, unknown>) | undefined = LiveConfig.getValueByKey(
    `config_currency_${currencyId}`,
  );
  if (!usual) {
    throw new Error(`No currency configuration available for ${currencyId}`);
  }
  const config = Object.fromEntries(
    Object.entries({ ...usual, ...local.endpoints }).filter(([, value]) => value !== undefined),
  ) as CurrencyConfig & Record<string, unknown>;

  const remote = urlsIn(config).filter(({ url }) => !isLocal(url));
  // A `ledger` client without a base URL falls back to Ledger's production explorers
  const ledgerClients = Object.entries(config)
    .filter(([, value]) => (value as { type?: unknown } | null)?.type === "ledger")
    .map(([field]) => field);
  if (ledgerClients.length && !isLocal(config.ledgerExplorerUri)) {
    remote.push({
      field: ledgerClients.join(", "),
      url: "Ledger's explorers (no ledgerExplorerUri)",
    });
  }
  if (remote.length) {
    throw new Error(
      `The local configuration of ${currencyId} still reaches its real network: ${remote
        .map(({ field, url }) => `${field} = ${url}`)
        .join(", ")}`,
    );
  }
  return config;
}
