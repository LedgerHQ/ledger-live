import { CurrencyLiveConfigDefinition } from "../../config";

const evmConfig: CurrencyLiveConfigDefinition = {
  config_currency_akroma: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_atheios: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_avalanche_c_chain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
      showNfts: false,
    },
  },
  config_currency_avalanche_c_chain_fuji: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://api.avax-test.network/ext/bc/C/rpc",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/43113",
      },
      showNfts: false,
    },
  },
  config_currency_bitlayer: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://rpc.bitlayer.org",
      },
      explorer: {
        type: "none",
      },
      showNfts: false,
    },
  },
  config_currency_bsc: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
      showNfts: false,
    },
  },
  config_currency_callisto: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_dexon: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_ellaism: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_ethereum: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
      showNfts: false,
    },
  },
  config_currency_sonic: {
    type: "object",
    default: {
      status: "active",
      node: {
        type: "external",
        uri: "https://sonic.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/146",
      },
      showNfts: false,
    },
  },
  config_currency_ethereum_classic: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
      showNfts: false,
    },
  },
  config_currency_ether1: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_ethergem: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_ethersocial: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_expanse: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_gochain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_hpb: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_mix: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_musicoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_pirl: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
    },
  },
  config_currency_poa: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_polygon: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
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
      showNfts: false,
    },
  },
  config_currency_reosc: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_thundercore: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_tomo: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_ubiq: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_wanchain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      showNfts: false,
    },
  },
  config_currency_arbitrum: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://arbitrum.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/42161",
      },
      showNfts: false,
    },
  },
  config_currency_cronos: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://cronos.coin.ledger.com",
      },
      explorer: {
        type: "none",
      },
      showNfts: false,
    },
  },
  config_currency_core: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://core.coin.ledger.com",
      },
      explorer: {
        type: "none",
      },
      showNfts: false,
    },
  },
  config_currency_fantom: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://fantom.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://ftmscout.com/api",
      },
      showNfts: false,
    },
  },
  config_currency_flare: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://flare.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://flare-explorer.flare.network/api",
      },
      showNfts: false,
    },
  },
  config_currency_songbird: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://songbird-api.flare.network/ext/C/rpc",
      },
      explorer: {
        type: "blockscout",
        uri: "https://songbird-explorer.flare.network/api",
      },
      showNfts: false,
    },
  },
  config_currency_moonbeam: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://moonbeam.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1284",
      },
      showNfts: false,
    },
  },
  config_currency_rsk: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://rsk.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://rootstock.blockscout.com/api",
      },
      showNfts: false,
    },
  },
  config_currency_bittorrent: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://bittorrent.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/199",
      },
      showNfts: false,
    },
  },
  config_currency_optimism: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://optimism.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://optimism.blockscout.com/api",
      },
      showNfts: false,
    },
  },
  config_currency_optimism_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://optimism-sepolia.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://optimism-sepolia.blockscout.com/api" },
      showNfts: false,
    },
  },
  config_currency_energy_web: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://rpc.energyweb.org",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.energyweb.org/api",
      },
      showNfts: false,
    },
  },
  config_currency_astar: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://astar.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://astar.blockscout.com/api",
      },
      showNfts: false,
    },
  },
  config_currency_metis: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://metis.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://andromeda-explorer.metis.io/api",
      },
      showNfts: false,
    },
  },
  config_currency_mantle: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://rpc.mantle.xyz",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.mantle.xyz/api",
      },
      showNfts: false,
    },
  },
  config_currency_mantle_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://rpc.sepolia.mantle.xyz",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.sepolia.mantle.xyz/api",
      },
      showNfts: false,
    },
  },
  config_currency_boba: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://boba.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.routescan.io/v2/network/mainnet/evm/288/etherscan",
      },
      showNfts: false,
    },
  },
  config_currency_moonriver: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://moonriver.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1285",
      },
      showNfts: false,
    },
  },
  config_currency_velas_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://evmexplorer.velas.com/rpc",
      },
      explorer: {
        type: "blockscout",
        uri: "https://evmexplorer.velas.com/api",
      },
      showNfts: false,
    },
  },
  config_currency_syscoin: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://syscoin.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.syscoin.org/api",
      },
      showNfts: false,
    },
  },
  config_currency_telos_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://telos-evm.coin.ledger.com",
      },
      explorer: {
        type: "teloscan",
        uri: "https://api.teloscan.io/api",
      },
      showNfts: false,
    },
  },
  config_currency_sei_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://sei-evm.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1329",
      },
      showNfts: false,
    },
  },
  config_currency_berachain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://berachain.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/80094",
      },
      showNfts: false,
    },
  },
  config_currency_hyperevm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://hyperliquid.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/999",
      },
      showNfts: false,
    },
  },
  config_currency_polygon_zk_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://polygon-zkevm.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1101",
      },
      showNfts: false,
    },
  },
  config_currency_base: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://base.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/8453",
      },
      showNfts: false,
    },
  },
  config_currency_klaytn: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://kaia.coin.ledger.com",
      },
      explorer: {
        type: "klaytnfinder",
        uri: "https://cypress-oapi.klaytnfinder.io/api",
      },
      showNfts: false,
    },
  },
  config_currency_klaytn_baobab: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://api.baobab.klaytn.net:8651",
      },
      explorer: {
        type: "klaytnfinder",
        uri: "https://baobab-oapi.klaytnfinder.io/api",
      },
      showNfts: false,
    },
  },
  config_currency_neon_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://neon-evm.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://neon.blockscout.com/api",
      },
      showNfts: false,
    },
  },
  config_currency_lukso: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://lukso.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer.execution.mainnet.lukso.network/api/v1/",
      },
      showNfts: false,
    },
  },
  config_currency_linea: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://linea.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/59144",
      },
      showNfts: false,
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
      node: { type: "ledger", explorerId: "eth_sepolia" },
      explorer: { type: "ledger", explorerId: "eth_sepolia" },
      gasTracker: { type: "ledger", explorerId: "eth_sepolia" },
      showNfts: false,
    },
  },
  config_currency_ethereum_hoodi: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "ledger", explorerId: "eth_hoodi" },
      explorer: { type: "ledger", explorerId: "eth_hoodi" },
      gasTracker: { type: "ledger", explorerId: "eth_hoodi" },
      showNfts: false,
    },
  },
  config_currency_polygon_amoy: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "ledger", explorerId: "matic_amoy" },
      explorer: { type: "ledger", explorerId: "matic_amoy" },
      gasTracker: { type: "ledger", explorerId: "matic_amoy" },
      showNfts: false,
    },
  },
  config_currency_arbitrum_sepolia: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "external", uri: "https://arbitrum-sepolia.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/421614",
      },
      showNfts: false,
    },
  },
  config_currency_polygon_zk_evm_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://polygon-zkevm-cardona.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/1442",
      },
      showNfts: false,
    },
  },
  config_currency_base_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://base-sepolia.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://base-sepolia.blockscout.com/api" },
      showNfts: false,
    },
  },
  config_currency_linea_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://linea-sepolia.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/59141",
      },
      showNfts: false,
    },
  },
  config_currency_blast: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://blast.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/81457",
      },
      showNfts: false,
    },
  },
  config_currency_blast_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://blast-sepolia.coin.ledger.com" },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/168587773",
      },
      showNfts: false,
    },
  },
  config_currency_scroll: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://scroll.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://scroll.blockscout.com/api" },
      showNfts: false,
    },
  },
  config_currency_scroll_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://scroll-sepolia.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://scroll-sepolia.blockscout.com/api" },
      showNfts: false,
    },
  },
  config_currency_shape: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://mainnet.shape.network" },
      explorer: { type: "blockscout", uri: "https://shapescan.xyz/api" },
      showNfts: false,
    },
  },
  config_currency_story: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://story.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://www.storyscan.io/api" },
      showNfts: false,
    },
  },
  config_currency_etherlink: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://node.mainnet.etherlink.com" },
      explorer: { type: "blockscout", uri: "https://explorer.etherlink.com/api" },
      showNfts: false,
    },
  },
  config_currency_zksync: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://zksync.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://zksync.blockscout.com/api" },
      showNfts: false,
    },
  },
  config_currency_zksync_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://zksync-sepolia.coin.ledger.com" },
      explorer: { type: "blockscout", uri: "https://zksync-sepolia.blockscout.com/api" },
      showNfts: false,
    },
  },
  config_currency_monad: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://monad.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/143",
      },
      showNfts: false,
    },
  },
  config_currency_monad_testnet: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://monad-testnet.coin.ledger.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://proxyetherscan.api.live.ledger.com/v2/api/10143",
      },
      showNfts: false,
    },
  },
  config_currency_somnia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://somnia-rpc.publicnode.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://mainnet.somnia.w3us.site/api",
      },
      showNfts: false,
    },
  },
  config_currency_zero_gravity: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://zero-gravity.coin.ledger.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://chainscan.0g.ai/open/api",
      },
      showNfts: false,
    },
  },
  config_currency_adi: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://rpc.adifoundation.ai",
      },
      explorer: {
        type: "blockscout",
        uri: "https://explorer-bls.adifoundation.ai/api",
      },
      showNfts: false,
    },
  },
  config_currency_unichain: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: {
        type: "external",
        uri: "https://unichain-rpc.publicnode.com",
      },
      explorer: {
        type: "blockscout",
        uri: "https://unichain.blockscout.com/api",
      },
      showNfts: false,
    },
  },
  config_currency_unichain_sepolia: {
    type: "object",
    default: {
      status: {
        type: "active",
        features: [{ id: "blockchain_txs", status: "active" }],
      },
      node: { type: "external", uri: "https://unichain-sepolia-rpc.publicnode.com" },
      explorer: { type: "blockscout", uri: "https://unichain-sepolia.blockscout.com/api" },
      showNfts: false,
    },
  },
};

export { evmConfig };
