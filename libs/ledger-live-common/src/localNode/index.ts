import type { EvmConfigInfo } from "@ledgerhq/coin-evm/config";
import type { StellarConfig } from "@ledgerhq/coin-stellar/config";
import type { TronConfig } from "@ledgerhq/coin-tron/config";
import type { XrpConfig } from "@ledgerhq/coin-xrp/config";
import type { CurrencyConfig } from "@ledgerhq/coin-module-framework/config";
import { LiveConfig } from "@ledgerhq/live-config/LiveConfig";

/** Where a currency's node, and explorer when it has one, live when it runs locally. */
export type LocalNodeEndpoints =
  | Pick<EvmConfigInfo, "node" | "explorer">
  | Pick<XrpConfig, "node">
  | Pick<StellarConfig, "explorer">
  | Pick<TronConfig, "explorer">;

/** A coin-sandbox EVM chain: its anvil fork on `rpcPort`, its Blockscout API on `apiPort`. */
const sandboxChain = (rpcPort: number, apiPort: number): LocalNodeEndpoints => ({
  node: { type: "external", uri: `http://localhost:${rpcPort}` },
  explorer: { type: "blockscout", uri: `http://localhost:${apiPort}/api` },
});

/**
 * Every currency that can run on a local node, started by coin-sandbox's
 * `scripts/chain <currency> up`, with the ports of its `docker/<family>/chains.json`. Fixed per
 * currency, so several can run at the same time.
 */
export const LOCAL_NODE_ENDPOINTS: Readonly<Record<string, LocalNodeEndpoints>> = {
  sonic: sandboxChain(8545, 4000),
  arbitrum: sandboxChain(8546, 4001),
  astar: sandboxChain(8547, 4002),
  base: sandboxChain(8548, 4003),
  berachain: sandboxChain(8549, 4004),
  bittorrent: sandboxChain(8550, 4005),
  cronos: sandboxChain(8551, 4006),
  energy_web: sandboxChain(8552, 4007),
  etherlink: sandboxChain(8553, 4008),
  flare: sandboxChain(8554, 4009),
  hyperevm: sandboxChain(8555, 4010),
  linea: sandboxChain(8556, 4011),
  lukso: sandboxChain(8557, 4012),
  mantle: sandboxChain(8558, 4013),
  monad: sandboxChain(8559, 4014),
  neon_evm: sandboxChain(8560, 4015),
  optimism: sandboxChain(8561, 4016),
  polygon_zk_evm: sandboxChain(8562, 4017),
  rsk: sandboxChain(8563, 4018),
  scroll: sandboxChain(8564, 4019),
  sei_evm: sandboxChain(8565, 4020),
  shape: sandboxChain(8566, 4021),
  somnia: sandboxChain(8567, 4022),
  songbird: sandboxChain(8568, 4023),
  syscoin: sandboxChain(8569, 4024),
  telos_evm: sandboxChain(8570, 4025),
  unichain: sandboxChain(8571, 4026),
  velas_evm: sandboxChain(8572, 4027),
  zksync: sandboxChain(8573, 4028),
  zero_gravity: sandboxChain(8574, 4029),
  adi: sandboxChain(8575, 4030),
  arc: sandboxChain(8576, 4031),
  ethereum: sandboxChain(8577, 4032),
  // A standalone rippled, behind a proxy that adds CORS: the XRP module only talks to its node.
  ripple: { node: "http://localhost:5005" },
  // A standalone Stellar network with the public passphrase, which coin-stellar hardcodes: Horizon.
  stellar: { explorer: { url: "http://localhost:8100" } },
  // tronbox/tre behind coin-sandbox's indexer, which serves the TronGrid API coin-tron reads.
  // Energy rental (Tronify) is not a chain field: it stays off.
  tron: { explorer: { url: "http://localhost:9090" } },
};

/**
 * What a local chain keeps from its default configuration, on top of `status`, `name` and `unit`:
 * how the chain behaves, never where to reach it. Anything naming a server — node, explorer, gas
 * tracker, Ledger explorer, node sources — is left out, so the local configuration can only point
 * at localhost.
 */
const CHAIN_FIELDS = [
  "chainId",
  "supportedTokens",
  "finalizationLevel",
  "nativeContracts",
  "minGasPrice",
  "feeHistoryBlockCount",
  "feeHistoryRewardPercentile",
  "calldataFloorGasPerToken",
  "calldataFloorZeroByteTokens",
  "forceLegacyTransactions",
  "eip1559BaseFeeMultiplier",
  "useStaticFees",
  "enableNetworkLogs",
] as const satisfies ReadonlyArray<keyof EvmConfigInfo | keyof StellarConfig>;

let localNodeCurrencies: ReadonlySet<string> = new Set();

/**
 * Selects the currencies that run on their local node instead of their default network.
 *
 * Called once by the app at boot, before any bridge is used: coin modules cache per chain id, so
 * switching a currency that already synced against its default network would mix both.
 */
export function setLocalNodeCurrencies(currencyIds: Iterable<string>): void {
  const ids = new Set(currencyIds);
  const unsupported = [...ids].filter(id => !(id in LOCAL_NODE_ENDPOINTS));
  if (unsupported.length) {
    throw new Error(
      `No local node for ${unsupported.join(", ")}. ` +
        `Supported: ${Object.keys(LOCAL_NODE_ENDPOINTS).join(", ")}`,
    );
  }
  localNodeCurrencies = ids;
}

export function getLocalNodeCurrencies(): string[] {
  return [...localNodeCurrencies];
}

/**
 * The configuration of `currencyId` when it runs on its local node, `undefined` when it runs on
 * its default network: the chain fields of its default configuration, plus the local endpoints.
 */
export function getLocalNodeConfig(currencyId: string): CurrencyConfig | undefined {
  const endpoints = localNodeCurrencies.has(currencyId)
    ? LOCAL_NODE_ENDPOINTS[currencyId]
    : undefined;
  if (!endpoints) return undefined;

  const defaults: (CurrencyConfig & Record<string, unknown>) | undefined = LiveConfig.getValueByKey(
    `config_currency_${currencyId}`,
  );
  if (!defaults) {
    throw new Error(`No currency configuration available for ${currencyId}`);
  }
  const chainFields = Object.fromEntries(
    CHAIN_FIELDS.filter(field => defaults[field] !== undefined).map(field => [
      field,
      defaults[field],
    ]),
  );

  return {
    status: defaults.status,
    name: defaults.name,
    unit: defaults.unit,
    ...chainFields,
    ...endpoints,
  };
}
