import { isPlainObjectOverride } from "@ledgerhq/live-config/LiveConfig";
import { getEnv } from "@shared/env";
import { CurrencyLiveConfigDefinition } from "../../config";

export function isLedgerBased(currencyConfiguration: Record<string, unknown>): boolean {
  return Boolean(
    typeof currencyConfiguration.default === "object" &&
    currencyConfiguration.default &&
    "node" in currencyConfiguration.default &&
    currencyConfiguration.default.node &&
    typeof currencyConfiguration.default.node === "object" &&
    "type" in currencyConfiguration.default.node &&
    currencyConfiguration.default.node.type === "ledger",
  );
}

function envBasedLedgerConfiguration(): Record<string, unknown> {
  return {
    ...(getEnv("EXPLORER") ? { ledgerExplorerUri: getEnv("EXPLORER") } : {}),
    ...(getEnv("LEDGER_CLIENT_VERSION")
      ? { ledgerClientVersion: getEnv("LEDGER_CLIENT_VERSION") }
      : {}),
    ...(getEnv("EIP1559_BASE_FEE_MULTIPLIER")
      ? { eip1559BaseFeeMultiplier: getEnv("EIP1559_BASE_FEE_MULTIPLIER") }
      : {}),
  };
}

function overridesDefaultsWithEnv(
  walletCurrenciesConfiguration: CurrencyLiveConfigDefinition,
): CurrencyLiveConfigDefinition {
  return Object.fromEntries(
    Object.entries(walletCurrenciesConfiguration).map(([currencyName, currencyConfiguration]) => [
      currencyName,
      {
        type: "object" as const,
        get default() {
          return isPlainObjectOverride(currencyConfiguration.default)
            ? {
                ...currencyConfiguration.default,
                ...(isLedgerBased(currencyConfiguration) ? envBasedLedgerConfiguration() : {}),
                ...(getEnv("EVM_FORCE_LEGACY_TRANSACTIONS")
                  ? { forceLegacyTransactions: getEnv("EVM_FORCE_LEGACY_TRANSACTIONS") }
                  : {}),
              }
            : {};
        },
      },
    ]),
  );
}

const evmCurrencies: CurrencyLiveConfigDefinition = {
  config_currency_akroma: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 200625,
      name: "Akroma",
    },
  },
  config_currency_atheios: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1620,
      name: "Atheios",
    },
  },
  config_currency_avalanche_c_chain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 43114,
      name: "Avalanche C-Chain",
      node: {
        type: "ledger",
        explorerId: "avax",
      },
      explorer: {
        type: "ledger",
        explorerId: "avax",
      },
      gasTracker: {
        type: "ledger",
        explorerId: "avax",
      },
    },
  },
  config_currency_avalanche_c_chain_fuji: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 43113,
      name: "Avalanche C-Chain Fuji",
      node: {
        type: "external",
        uri: "https://api.avax-test.network/ext/bc/C/rpc",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/43113",
      },
    },
  },
  config_currency_bitlayer: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 200901,
      name: "Bitlayer",
      node: {
        type: "external",
        uri: "https://rpc.bitlayer.org",
      },
      explorer: {
        type: "none",
      },
    },
  },
  config_currency_bsc: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 56,
      name: "BNB Chain",
      node: {
        type: "ledger",
        explorerId: "bnb",
      },
      explorer: {
        type: "ledger",
        explorerId: "bnb",
      },
      gasTracker: {
        type: "ledger",
        explorerId: "bnb",
      },
    },
  },
  config_currency_callisto: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 820,
      name: "Callisto",
    },
  },
  config_currency_dexon: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 237,
      name: "DEXON",
    },
  },
  config_currency_ellaism: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 64,
      name: "Ellaism",
    },
  },
  config_currency_ethereum: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1,
      name: "Ethereum",
      gasTracker: {
        type: "ledger",
        explorerId: "eth",
      },
      node: {
        type: "ledger",
        explorerId: "eth",
      },
      explorer: {
        type: "ledger",
        explorerId: "eth",
      },
    },
  },
  config_currency_sonic: {
    type: "object",
    default: {
      status: "active",
      chainId: 146,
      name: "Sonic",
      node: {
        type: "external",
        uri: "https://sonic.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/146",
      },
    },
  },
  config_currency_ethereum_classic: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 61,
      name: "Ethereum Classic",
      node: {
        type: "ledger",
        explorerId: "etc",
      },
      explorer: {
        type: "ledger",
        explorerId: "etc",
      },
      gasTracker: {
        type: "ledger",
        explorerId: "etc",
      },
    },
  },
  config_currency_ether1: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1313114,
      name: "Ether1",
    },
  },
  config_currency_ethergem: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1987,
      name: "EtherGem",
    },
  },
  config_currency_ethersocial: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 31102,
      name: "Ethersocial",
    },
  },
  config_currency_expanse: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 2,
      name: "Expanse",
    },
  },
  config_currency_gochain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 60,
      name: "GoChain",
    },
  },
  config_currency_hpb: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 269,
      name: "High Performance Blockchain",
    },
  },
  config_currency_mix: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 76,
      name: "MIX Blockchain",
    },
  },
  config_currency_musicoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 7762959,
      name: "Musicoin",
    },
  },
  config_currency_pirl: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 3125659152,
      name: "Pirl",
    },
  },
  config_currency_poa: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 99,
      name: "POA",
    },
  },
  config_currency_polygon: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 137,
      name: "Polygon",
      node: {
        type: "ledger",
        explorerId: "matic",
      },
      explorer: {
        type: "ledger",
        explorerId: "matic",
        batchSize: 10,
      },
      gasTracker: {
        type: "ledger",
        explorerId: "matic",
      },
      minGasPrice: "25000000000",
    },
  },
  config_currency_reosc: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 2894,
      name: "REOSC",
    },
  },
  config_currency_thundercore: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 108,
      name: "Thundercore",
    },
  },
  config_currency_tomo: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 88,
      name: "TomoChain",
    },
  },
  config_currency_ubiq: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 8,
      name: "Ubiq",
    },
  },
  config_currency_wanchain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 888,
      name: "Wanchain",
    },
  },
  config_currency_arbitrum: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 42161,
      name: "Arbitrum",
      node: {
        type: "external",
        uri: "https://arbitrum.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/42161",
      },
    },
  },
  config_currency_cronos: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 25,
      name: "Cronos",
      node: {
        type: "external",
        uri: "https://cronos.coin.ledger.com",
      },
      explorer: {
        type: "cronos",
        uri: "https://proxycronosexplorer.api.live.ledger.com/explorer/api",
      },
    },
  },
  config_currency_core: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1116,
      name: "Core",
      node: {
        type: "external",
        uri: "https://core.coin.ledger.com",
      },
      explorer: {
        type: "none",
      },
    },
  },
  config_currency_fantom: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 250,
      name: "Fantom",
      node: {
        type: "external",
        uri: "https://fantom.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://ftmscout.com/api",
      },
    },
  },
  config_currency_flare: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 14,
      name: "Flare",
      node: {
        type: "external",
        uri: "https://flare.coin.ledger.com/ext/bc/C/rpc",
      },
      explorer: {
        type: "blockscout",
        uri: "https://flare-explorer.flare.network/api",
      },
    },
  },
  config_currency_songbird: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 19,
      name: "Songbird",
      node: {
        type: "external",
        uri: "https://songbird-api.flare.network/ext/C/rpc",
      },
      explorer: {
        type: "blockscout",
        uri: "https://songbird-explorer.flare.network/api",
      },
    },
  },
  config_currency_moonbeam: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1284,
      name: "Moonbeam",
      node: {
        type: "external",
        uri: "https://moonbeam.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1284",
      },
    },
  },
  config_currency_rsk: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 30,
      name: "Rootstock",
      node: {
        type: "external",
        uri: "https://rsk.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://rootstock.blockscout.com/api",
      },
    },
  },
  config_currency_bittorrent: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 199,
      name: "Bittorent Chain",
      node: {
        type: "external",
        uri: "https://bittorrent.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/199",
      },
    },
  },
  config_currency_optimism: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 10,
      name: "OP Mainnet",
      node: {
        type: "external",
        uri: "https://optimism.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://optimism.blockscout.com/api",
      },
    },
  },
  config_currency_optimism_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 11155420,
      name: "OP Sepolia",
      node: { type: "external", uri: "https://optimism-sepolia.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://optimism-sepolia.blockscout.com/api" },
    },
  },
  config_currency_energy_web: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 246,
      name: "Energy Web",
      node: {
        type: "external",
        uri: "https://rpc.energyweb.org",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.energyweb.org/api",
      },
    },
  },
  config_currency_astar: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 592,
      name: "Astar",
      node: {
        type: "external",
        uri: "https://astar.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://astar.blockscout.com/api",
      },
    },
  },
  config_currency_metis: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1088,
      name: "Metis",
      node: {
        type: "external",
        uri: "https://metis.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://andromeda-explorer.metis.io/api",
      },
    },
  },
  config_currency_mantle: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 5000,
      name: "Mantle",
      node: {
        type: "external",
        uri: "https://rpc.mantle.xyz",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.mantle.xyz/api",
      },
    },
  },
  config_currency_mantle_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 5003,
      name: "Mantle Sepolia",
      node: {
        type: "external",
        uri: "https://rpc.sepolia.mantle.xyz",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.sepolia.mantle.xyz/api",
      },
    },
  },
  config_currency_boba: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 288,
      name: "Boba",
      node: {
        type: "external",
        uri: "https://boba.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.routescan.io/v2/network/mainnet/evm/288/etherscan",
      },
    },
  },
  config_currency_moonriver: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1285,
      name: "Moonriver",
      node: {
        type: "external",
        uri: "https://moonriver.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1285",
      },
    },
  },
  config_currency_velas_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 106,
      name: "Velas EVM",
      node: {
        type: "external",
        uri: "https://evmexplorer.velas.com/rpc",
      },
      explorer: {
        type: "blockscout",
        uri: "https://evmexplorer.velas.com/api",
      },
    },
  },
  config_currency_syscoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 57,
      name: "Syscoin",
      node: {
        type: "external",
        uri: "https://syscoin.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.syscoin.org/api",
      },
    },
  },
  config_currency_telos_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 40,
      name: "Telos",
      node: {
        type: "external",
        uri: "https://telos-evm.coin.ledger.com",
      },
      explorer: {
        type: "teloscan",
        uri: "https://api.teloscan.io/api",
      },
    },
  },
  config_currency_sei_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1329,
      name: "SEI Network (EVM)",
      node: {
        type: "external",
        uri: "https://sei-evm.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1329",
      },
    },
  },
  config_currency_berachain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 80094,
      name: "Berachain",
      node: {
        type: "external",
        uri: "https://berachain.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/80094",
      },
    },
  },
  config_currency_hyperevm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 999,
      name: "HyperEVM",
      node: {
        type: "external",
        uri: "https://hyperliquid.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/999",
      },
    },
  },
  config_currency_polygon_zk_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1101,
      name: "Polygon zkEVM",
      node: {
        type: "external",
        uri: "https://polygon-zkevm.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1101",
      },
    },
  },
  config_currency_base: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 8453,
      name: "Base",
      node: {
        type: "external",
        uri: "https://base.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/8453",
      },
    },
  },
  config_currency_klaytn: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 8217,
      name: "Klaytn",
      node: {
        type: "external",
        uri: "https://kaia.coin.ledger.com",
      },
      explorer: {
        type: "klaytnfinder",
        uri: "https://cypress-oapi.klaytnfinder.io/api",
      },
    },
  },
  config_currency_klaytn_baobab: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1001,
      name: "Klaytn Baobab",
      node: {
        type: "external",
        uri: "https://api.baobab.klaytn.net:8651",
      },
      explorer: {
        type: "klaytnfinder",
        uri: "https://baobab-oapi.klaytnfinder.io/api",
      },
    },
  },
  config_currency_neon_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 245022934,
      name: "Neon EVM",
      node: {
        type: "external",
        uri: "https://neon-evm.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://neon.blockscout.com/api",
      },
    },
  },
  config_currency_lukso: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 42,
      name: "Lukso",
      node: {
        type: "external",
        uri: "https://lukso.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.execution.mainnet.lukso.network/api/v1/",
      },
    },
  },
  config_currency_linea: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 59144,
      name: "Linea",
      node: {
        type: "external",
        uri: "https://linea.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/59144",
      },
    },
  },
  // testnets
  config_currency_ethereum_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 11155111,
      name: "Ethereum Sepolia",
      node: { type: "ledger", explorerId: "eth_sepolia" },
      explorer: { type: "ledger", explorerId: "eth_sepolia" },
      gasTracker: { type: "ledger", explorerId: "eth_sepolia" },
    },
  },
  config_currency_ethereum_hoodi: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 560048,
      name: "Ethereum Hoodi",
      node: { type: "ledger", explorerId: "eth_hoodi" },
      explorer: { type: "ledger", explorerId: "eth_hoodi" },
      gasTracker: { type: "ledger", explorerId: "eth_hoodi" },
    },
  },
  config_currency_polygon_amoy: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 80002,
      name: "Polygon Amoy",
      node: { type: "ledger", explorerId: "matic_amoy" },
      explorer: { type: "ledger", explorerId: "matic_amoy" },
      gasTracker: { type: "ledger", explorerId: "matic_amoy" },
    },
  },
  config_currency_arbitrum_sepolia: {
    type: "object",
    default: {
      status: { type: "active" },
      chainId: 421614,
      name: "Arbitrum Sepolia",
      node: { type: "external", uri: "https://arbitrum-sepolia.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/421614",
      },
    },
  },
  config_currency_polygon_zk_evm_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1442,
      name: "Polygon zkEVM Testnet",
      node: { type: "external", uri: "https://polygon-zkevm-cardona.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1442",
      },
    },
  },
  config_currency_base_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 84532,
      name: "Base Sepolia",
      node: { type: "external", uri: "https://base-sepolia.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://base-sepolia.blockscout.com/api" },
    },
  },
  config_currency_linea_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 59141,
      name: "Linea Sepolia",
      node: { type: "external", uri: "https://linea-sepolia.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/59141",
      },
    },
  },
  config_currency_blast: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 81457,
      name: "Blast",
      node: { type: "external", uri: "https://blast.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/81457",
      },
    },
  },
  config_currency_blast_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 168587773,
      name: "Blast Sepolia",
      node: { type: "external", uri: "https://blast-sepolia.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/168587773",
      },
    },
  },
  config_currency_scroll: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 534352,
      name: "Scroll",
      node: { type: "external", uri: "https://scroll.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://scroll.blockscout.com/api" },
    },
  },
  config_currency_shape: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 360,
      name: "Shape",
      node: { type: "external", uri: "https://mainnet.shape.network" },
      explorer: { type: "blockscout", uri: "https://shapescan.xyz/api" },
    },
  },
  config_currency_story: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1514,
      name: "Story",
      node: { type: "external", uri: "https://story.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://www.storyscan.io/api" },
    },
  },
  config_currency_etherlink: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 42793,
      name: "Etherlink",
      node: { type: "external", uri: "https://node.mainnet.etherlink.com" },
      explorer: { type: "blockscout", uri: "https://explorer.etherlink.com/api" },
    },
  },
  config_currency_zksync: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 324,
      name: "ZKsync",
      node: { type: "external", uri: "https://zksync.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://zksync.blockscout.com/api" },
    },
  },
  config_currency_zksync_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 300,
      name: "ZKsync Sepolia",
      node: { type: "external", uri: "https://zksync-sepolia.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://zksync-sepolia.blockscout.com/api" },
    },
  },
  config_currency_monad: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 143,
      name: "Monad",
      node: {
        type: "external",
        uri: "https://monad.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/143",
      },
    },
  },
  config_currency_monad_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 10143,
      name: "Monad Testnet",
      node: {
        type: "external",
        uri: "https://monad-testnet.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/10143",
      },
    },
  },
  config_currency_somnia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 5031,
      name: "Somnia",
      node: {
        type: "external",
        uri: "https://somnia-rpc.publicnode.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://mainnet.somnia.w3us.site/api",
      },
    },
  },
  config_currency_zero_gravity: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 16661,
      name: "0G",
      node: {
        type: "external",
        uri: "https://zero-gravity.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://chainscan.0g.ai/open/api",
      },
      minGasPrice: "2000000000",
    },
  },
  config_currency_adi: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 36900,
      name: "Adi",
      node: {
        type: "external",
        uri: "https://rpc.adifoundation.ai",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer-bls.adifoundation.ai/api",
      },
    },
  },
  config_currency_unichain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 130,
      name: "Unichain",
      node: {
        type: "external",
        uri: "https://unichain-rpc.publicnode.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://unichain.blockscout.com/api",
      },
    },
  },
  config_currency_unichain_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 1301,
      name: "Unichain Sepolia",
      node: { type: "external", uri: "https://unichain-sepolia-rpc.publicnode.com" },
      explorer: { type: "blockscout", uri: "https://unichain-sepolia.blockscout.com/api" },
    },
  },
  config_currency_arc: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 5042,
      name: "Arc",
      node: {
        type: "external",
        uri: "https://arc.coin.ledger.com",
      },
      explorer: {
        type: "none",
      },
      nativeContracts: ["0x0000000000000000000000000000000000000000"],
      feeHistoryBlockCount: 1024,
      feeHistoryRewardPercentile: 60,
    },
  },
  config_currency_arc_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 5042002,
      name: "Arc Testnet",
      node: { type: "external", uri: "https://rpc.testnet.arc.network" },
      explorer: {
        type: "blockscout",
        uri: "https://proxyblockscout.api.live.ledger.com/5042002/api",
      },
      nativeContracts: ["0x3600000000000000000000000000000000000000"],
      feeHistoryBlockCount: 1024,
      feeHistoryRewardPercentile: 60,
    },
  },
  config_currency_robinhood: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 4663,
      name: "Robinhood Chain",
      node: { type: "external", uri: "https://robinhood.coin.ledger.com" },
      explorer: {
        type: "none",
      },
    },
  },
  config_currency_robinhood_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      chainId: 46630,
      name: "Robinhood Chain Testnet",
      node: { type: "external", uri: "https://rpc.testnet.chain.robinhood.com" },
      explorer: {
        type: "none",
      },
    },
  },
};

export const evmConfig = overridesDefaultsWithEnv(evmCurrencies);
