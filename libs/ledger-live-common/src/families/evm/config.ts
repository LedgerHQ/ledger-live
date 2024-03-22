import { CurrencyLiveConfigDefinition } from "../../config";

const evmConfig: CurrencyLiveConfigDefinition = {
  config_currency_akroma: {
    type: "object",
    default: {
      status: { type: "active" },
    },
  },
  config_currency_atheios: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_avalanche_c_chain: {
    type: "object",
    default: {
      status: {
        type: "active",
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
    },
  },
  config_currency_bsc: {
    type: "object",
    default: {
      status: {
        type: "active",
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
    },
  },
  config_currency_callisto: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_dexon: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_ellaism: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_ethereum: {
    type: "object",
    default: {
      status: {
        type: "active",
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
    },
  },
  config_currency_ethereum_classic: {
    type: "object",
    default: {
      status: {
        type: "active",
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
    },
  },
  config_currency_ether1: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_ethergem: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_ethersocial: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_expanse: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_gochain: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_hpb: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_mix: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_musicoin: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_pirl: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_poa: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_polygon: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "ledger",
        explorerId: "matic",
      },
      explorer: {
        type: "ledger",
        explorerId: "matic",
      },
      gasTracker: {
        type: "ledger",
        explorerId: "matic",
      },
    },
  },
  config_currency_reosc: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_thundercore: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_tomo: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_ubiq: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_wanchain: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
    },
  },
  config_currency_arbitrum: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://arb1.arbitrum.io/rpc",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.arbiscan.io/api",
      },
    },
  },
  config_currency_cronos: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://evm.cronos.org",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.cronoscan.com/api",
      },
    },
  },
  config_currency_fantom: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://rpcapi.fantom.network",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.ftmscan.com/api",
      },
    },
  },
  config_currency_flare: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://flare-api.flare.network/ext/bc/C/rpc",
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
      },
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
      },
      node: {
        type: "external",
        uri: "https://rpc.api.moonbeam.network",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api-moonbeam.moonscan.io/api",
      },
    },
  },
  config_currency_rsk: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://public-node.rsk.co",
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
      },
      node: {
        type: "external",
        uri: "https://rpc.bt.io",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.bttcscan.com/api",
      },
    },
  },
  config_currency_optimism: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://mainnet.optimism.io",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api-optimistic.etherscan.io/api",
      },
    },
  },
  config_currency_energy_web: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
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
      },
      node: {
        type: "external",
        uri: "https://evm.astar.network",
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
      },
      node: {
        type: "external",
        uri: "https://andromeda.metis.io/?owner=1088",
      },
      explorer: {
        type: "blockscout",
        uri: "https://andromeda-explorer.metis.io/api",
      },
    },
  },
  config_currency_boba: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://mainnet.boba.network",
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
      },
      node: {
        type: "external",
        uri: "https://rpc.api.moonriver.moonbeam.network",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api-moonriver.moonscan.io/api",
      },
    },
  },
  config_currency_velas_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
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
      },
      node: {
        type: "external",
        uri: "https://rpc.syscoin.org",
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
      },
      node: {
        type: "external",
        uri: "https://mainnet.telos.net/evm",
      },
      explorer: {
        type: "teloscan",
        uri: "https://api.teloscan.io/api",
      },
    },
  },
  config_currency_polygon_zk_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://zkevm-rpc.com",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api-zkevm.polygonscan.com/api",
      },
    },
  },
  config_currency_base: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://developer-access-mainnet.base.org",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.basescan.org/api",
      },
    },
  },
  config_currency_klaytn: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://public-en-cypress.klaytn.net",
      },
      explorer: {
        type: "klaytnfinder",
        uri: "https://cypress-oapi.klaytnfinder.io/api",
      },
    },
  },
  config_currency_neon_evm: {
    type: "object",
    default: {
      status: {
        type: "active",
      },
      node: {
        type: "external",
        uri: "https://neon-mainnet.everstake.one",
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
      },
      node: {
        type: "external",
        uri: "https://rpc.mainnet.lukso.network",
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
      },
      node: {
        type: "external",
        uri: "https://rpc.linea.build",
      },
      explorer: {
        type: "etherscan",
        uri: "https://api.lineascan.build/api",
      },
    },
  },
  // testnets
  config_currency_ethereum_ropsten: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "ledger", explorerId: "eth_ropsten" },
      explorer: { type: "ledger", explorerId: "eth_ropsten" },
      gasTracker: { type: "ledger", explorerId: "eth_ropsten" },
    },
  },
  config_currency_ethereum_goerli: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "ledger", explorerId: "eth_goerli" },
      explorer: { type: "ledger", explorerId: "eth_goerli" },
      gasTracker: { type: "ledger", explorerId: "eth_goerli" },
    },
  },
  config_currency_ethereum_sepolia: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "ledger", explorerId: "eth_sepolia" },
      explorer: { type: "ledger", explorerId: "eth_sepolia" },
      gasTracker: { type: "ledger", explorerId: "eth_sepolia" },
    },
  },
  config_currency_ethereum_holesky: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "ledger", explorerId: "eth_holesky" },
      explorer: { type: "ledger", explorerId: "eth_holesky" },
      gasTracker: { type: "ledger", explorerId: "eth_holesky" },
    },
  },
  config_currency_arbitrum_sepolia: {
    type: "object",
    default: {
      node: { type: "external", uri: "https://sepolia-rollup.arbitrum.io/rpc" },
      explorer: { type: "etherscan", uri: "https://api-sepolia.arbiscan.io/api" },
    },
  },
  config_currency_optimism_goerli: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "external", uri: "https://goerli.optimism.io" },
      explorer: { type: "etherscan", uri: "https://api-goerli-optimistic.etherscan.io/api" },
    },
  },
  config_currency_polygon_zk_evm_testnet: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "external", uri: "https://rpc.public.zkevm-test.net" },
      explorer: { type: "etherscan", uri: "https://api-testnet-zkevm.polygonscan.com/api" },
    },
  },
  config_currency_base_sepolia: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "external", uri: "https://sepolia.base.org" },
      explorer: { type: "etherscan", uri: "https://api-sepolia.basescan.org/api" },
    },
  },
  config_currency_linea_goerli: {
    type: "object",
    default: {
      status: { type: "active" },
      node: { type: "external", uri: "https://rpc.goerli.linea.build" },
      explorer: { type: "etherscan", uri: "https://api-testnet.lineascan.build/api" },
    },
  },
};

export { evmConfig };
