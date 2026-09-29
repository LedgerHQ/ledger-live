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
      unit: { name: "AKA", code: "AKA", magnitude: 8 },
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
      unit: { name: "ATH", code: "ATH", magnitude: 8 },
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
      unit: { name: "AVAX", code: "AVAX", magnitude: 18 },
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
      unit: { name: "AVAX", code: "AVAX", magnitude: 18 },
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
      unit: { name: "BTC", code: "BTC", magnitude: 18 },
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
      unit: { name: "BNB", code: "BNB", magnitude: 18 },
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
      unit: { name: "CLO", code: "CLO", magnitude: 8 },
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
      unit: { name: "dexon", code: "DXN", magnitude: 6 },
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
      unit: { name: "ELLA", code: "ELLA", magnitude: 8 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "S", code: "S", magnitude: 18 },
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
      unit: { name: "ETC", code: "ETC", magnitude: 18 },
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
      unit: { name: "ETHO", code: "ETHO", magnitude: 18 },
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
      unit: { name: "EGEM", code: "EGEM", magnitude: 18 },
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
      unit: { name: "ESN", code: "ESN", magnitude: 18 },
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
      unit: { name: "EXP", code: "EXP", magnitude: 8 },
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
      unit: { name: "GO", code: "GO", magnitude: 8 },
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
      unit: { name: "hpb", code: "HPB", magnitude: 18 },
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
      unit: { name: "MIX", code: "MIX", magnitude: 8 },
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
      unit: { name: "MUSIC", code: "MUSIC", magnitude: 8 },
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
      unit: { name: "PIRL", code: "PIRL", magnitude: 8 },
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
      unit: { name: "POA", code: "POA", magnitude: 8 },
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
      unit: { name: "POL", code: "POL", magnitude: 18 },
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
      unit: { name: "REOSC", code: "REOSC", magnitude: 16 },
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
      unit: { name: "TT", code: "TT", magnitude: 18 },
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
      unit: { name: "TOMO", code: "TOMO", magnitude: 18 },
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
      unit: { name: "ubiq", code: "UBQ", magnitude: 18 },
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
      unit: { name: "WAN", code: "WAN", magnitude: 8 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "CRO", code: "CRO", magnitude: 18 },
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
      unit: { name: "CORE", code: "CORE", magnitude: 18 },
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
      unit: { name: "FTM", code: "FTM", magnitude: 18 },
      node: {
        type: "external",
        uri: "https://fantom.coin.ledger.com",
      },
      explorer: {
        type: "none",
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
      unit: { name: "FLR", code: "FLR", magnitude: 18 },
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
      unit: { name: "SGB", code: "SGB", magnitude: 18 },
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
      unit: { name: "GLMR", code: "GLMR", magnitude: 18 },
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
      unit: { name: "RBTC", code: "RBTC", magnitude: 18 },
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
      unit: { name: "BTT", code: "BTT", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
      node: {
        type: "external",
        uri: "https://optimism.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://proxyblockscout.api.live.ledger.com/10/api",
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "EWT", code: "EWT", magnitude: 18 },
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
      unit: { name: "ASTR", code: "ASTR", magnitude: 18 },
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
      unit: { name: "METIS", code: "METIS", magnitude: 18 },
      node: {
        type: "external",
        uri: "https://metis.coin.ledger.com",
      },
      explorer: {
        type: "none",
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
      unit: { name: "MNT", code: "MNT", magnitude: 18 },
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
      unit: { name: "MNT", code: "MNT", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "MOVR", code: "MOVR", magnitude: 18 },
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
      unit: { name: "VLX", code: "VLX", magnitude: 18 },
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
      unit: { name: "SYS", code: "SYS", magnitude: 18 },
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
      unit: { name: "TLOS", code: "TLOS", magnitude: 18 },
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
      unit: { name: "SEI", code: "SEI", magnitude: 18 },
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
      unit: { name: "BERA", code: "BERA", magnitude: 18 },
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
      unit: { name: "HYPE", code: "HYPE", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "KLAY", code: "KLAY", magnitude: 18 },
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
      unit: { name: "KLAY", code: "KLAY", magnitude: 18 },
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
      unit: { name: "NEON", code: "NEON", magnitude: 18 },
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
      unit: { name: "LYX", code: "LYX", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "POL", code: "POL", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
      node: { type: "external", uri: "https://scroll.coin.ledger.com" },
      explorer: {
        type: "blockscout",
        uri: "https://proxyblockscout.api.live.ledger.com/534352/api",
      },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "IP", code: "IP", magnitude: 18 },
      node: { type: "external", uri: "https://story.coin.ledger.com" },
      explorer: {
        type: "blockscout",
        uri: "https://proxyblockscout.api.live.ledger.com/1514/api",
      },
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
      unit: { name: "XTZ", code: "XTZ", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "ETH", code: "ETH", magnitude: 18 },
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
      unit: { name: "MON", code: "MON", magnitude: 18 },
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
      unit: { name: "MON", code: "MON", magnitude: 18 },
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
      unit: { name: "SOMI", code: "SOMI", magnitude: 18 },
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
      unit: { name: "0G", code: "0G", magnitude: 18 },
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
      unit: { name: "ADI", code: "ADI", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "USDC", code: "USDC", magnitude: 18 },
      node: {
        type: "external",
        uri: "https://arc.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://proxyblockscout.api.live.ledger.com/5042/api",
      },
      nativeContracts: ["0x3600000000000000000000000000000000000000"],
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
      unit: { name: "USDC", code: "USDC", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
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
      unit: { name: "ether", code: "ETH", magnitude: 18 },
      node: { type: "external", uri: "https://rpc.testnet.chain.robinhood.com" },
      explorer: {
        type: "none",
      },
    },
  },
};

export const evmConfig = overridesDefaultsWithEnv(evmCurrencies);
