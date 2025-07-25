import { AppManifest } from "@ledgerhq/live-common/wallet-api/types";

export const mocks: AppManifest[] = [
  {
    id: "dummy",
    name: "Dummy Wallet App",
    url: "http://localhost:5173",
    homepageUrl: "http://localhost:5173",
    icon: "",
    apiVersion: "^2.0.0",
    manifestVersion: "2",
    branch: "stable",
    categories: ["games"],
    currencies: ["bitcoin", "ethereum", "ethereum/erc20/usd_tether__erc20_"],
    content: {
      shortDescription: {
        en: "dummy app",
      },
      description: {
        en: "dummy app",
      },
    },
    permissions: [
      "account.list",
      "account.receive",
      "account.request",
      "currency.list",
      "device.close",
      "device.exchange",
      "device.transport",
      "message.sign",
      "transaction.sign",
      "transaction.signAndBroadcast",
      "wallet.capabilities",
      "custom.logger.log",
      "storage.set",
      "event.custom.test",
    ],
    domains: ["http://*", "https://*"],
    platforms: ["android", "desktop", "ios"],
    visibility: "complete",
  },
  {
    id: "wallet-api-tools",
    author: "ledger",
    name: "Wallet API Tools",
    url: "https://wallet-api-wallet-api-tools.vercel.app/",
    homepageUrl: "https://developers.ledger.com/",
    platforms: ["android", "ios", "desktop"],
    apiVersion: "^2.0.0 || ^1.0.0",
    manifestVersion: "2",
    branch: "debug",
    categories: ["other"],
    currencies: [
      "aptos",
      "bitcoin",
      "ethereum/**",
      "axelar",
      "stargaze",
      "secret_network",
      "umee",
      "desmos",
      "dydx",
      "onomy",
      "sei_network",
      "quicksilver",
      "persistence",
      "avalanche_c_chain",
      "bsc/**",
      "polkadot",
      "solana",
      "ripple",
      "litecoin",
      "polygon/**",
      "bitcoin_cash",
      "stellar/**",
      "dogecoin",
      "cosmos",
      "crypto_org",
      "crypto_org_croeseid",
      "celo",
      "dash",
      "tron/**",
      "tezos",
      "multiversx/**",
      "ethereum_classic",
      "zcash",
      "decred",
      "digibyte",
      "algorand/**",
      "qtum",
      "bitcoin_gold",
      "komodo",
      "zencash",
      "vertcoin",
      "peercoin",
      "viacoin",
      "bitcoin_testnet",
      "ethereum_ropsten/**",
      "ethereum_goerli/**",
      "ethereum_sepolia/**",
      "ethereum_holesky",
      "hedera",
      "cardano/**",
      "filecoin",
      "osmo",
      "fantom",
      "cronos",
      "moonbeam",
      "songbird",
      "flare",
      "near",
      "optimism/**",
      "optimism_goerli",
      "arbitrum/**",
      "arbitrum_goerli",
      "arbitrum_sepolia",
      "rsk",
      "bittorrent",
      "kava_evm",
      "evmos_evm",
      "energy_web",
      "astar",
      "metis",
      "boba",
      "moonriver",
      "velas_evm",
      "syscoin",
      "klaytn",
      "polygon_zk_evm",
      "polygon_zk_evm_testnet",
      "base",
      "base_goerli",
      "base_sepolia",
      "telos_evm",
      "hyperevm",
      "sei_network_evm",
      "berachain",
      "coreum",
      "injective",
      "neon_evm",
      "lukso",
      "linea",
      "linea_goerli",
    ],
    content: {
      shortDescription: {
        en: "Try out the Ledger Live API to test capabilities of our platform integration solution. Use at your own risk.",
      },
      description: {
        en: "Try out the Ledger Live API to test capabilities of our platform integration solution. Use at your own risk.",
      },
    },
    permissions: [
      "account.list",
      "account.receive",
      "account.request",
      "currency.list",
      "device.close",
      "device.exchange",
      "device.transport",
      "device.select",
      "device.open",
      "message.sign",
      "transaction.sign",
      "transaction.signAndBroadcast",
      "storage.set",
      "storage.get",
      "bitcoin.getXPub",
      "wallet.capabilities",
      "wallet.userId",
      "wallet.info",
      "exchange.start",
      "exchange.complete",
    ],
    domains: ["https://"],
    visibility: "complete",
  },
  {
    id: "stader-eth",
    name: "Stader Labs - Ethereum Staking",
    private: false,
    url: "https://www.staderlabs.com/eth/stake/",
    dapp: {
      provider: "evm",
      nanoApp: "Staderlabs",
      networks: [
        {
          currency: "ethereum",
          chainID: 1,
          nodeURL: "https://eth-dapps.api.live.ledger.com",
        },
      ],
    },
    homepageUrl: "https://www.staderlabs.com/eth/",
    icon: "https://cdn.live.ledger.com/icons/platform/stader-bnb.png",
    platforms: ["android", "ios", "desktop"],
    apiVersion: "^2.0.0 || ^1.0.0",
    manifestVersion: "2",
    branch: "stable",
    categories: ["defi"],
    currencies: ["ethereum", "ethereum/erc20/bnb", "bsc"],
    content: {
      shortDescription: {
        en: "Our liquid staking solution allows users to stake ETH and get a fungible liquid token(ETHx) back that shows their claim to the underlying staked assets. We work with the ecosystem projects to ensure wide usability of these tokens on DEXs, lending/borrowing protocols, yield aggregators and more.",
      },
      description: {
        en: "About Stader - Stader is a non-custodial, smart contract-based staking platform that helps retail and institutions conveniently discover and access staking solutions. In addition to its own platform, Stader’s modular smart contracts and staking middleware infrastructure for Proof-of-Stake (PoS) networks can be leveraged for retail crypto users, exchanges, custodians, and mainstream FinTech players Our Project - Stader Liquid staking helps us build a future where community members will no longer have to choose between securing the network through staking or participating in the thriving DeFi, NFT and gaming protocols on Polygon. Instead, users can access both staking and DeFi rewards using the liquid token across liquidity pools, yield farming, lending and borrowing. Stader provides a convenient way for the community to stake with multiple validators at once, helping them reduce risk & costs while increasing returns. Our liquid staking solution allows users to stake Matic and get a fungible liquid token MaticX that shows their claim to the underlying staked assets. The MaticX token can be leveraged on the multiple Defi opportunities.",
      },
    },
    permissions: [
      "account.list",
      "account.request",
      "currency.list",
      "message.sign",
      "transaction.signAndBroadcast",
    ],
    domains: ["https://"],
    visibility: "complete",
  },
  {
    id: "clear-signing",
    name: "Clear-signing",
    private: false,
    url: "https://www.staderlabs.com/eth/stake/",
    homepageUrl: "https://www.staderlabs.com/eth/",
    icon: "https://cdn.live.ledger.com/icons/platform/stader-bnb.png",
    platforms: ["android", "ios", "desktop"],
    apiVersion: "^2.0.0 || ^1.0.0",
    manifestVersion: "2",
    branch: "stable",
    categories: ["defi", "clear signing"],
    currencies: ["ethereum", "ethereum/erc20/bnb", "bsc"],
    content: {
      shortDescription: {
        en: "Our liquid staking solution allows users to stake ETH and get a fungible liquid token(ETHx) back that shows their claim to the underlying staked assets. We work with the ecosystem projects to ensure wide usability of these tokens on DEXs, lending/borrowing protocols, yield aggregators and more.",
      },
      description: {
        en: "About Stader - Stader is a non-custodial, smart contract-based staking platform that helps retail and institutions conveniently discover and access staking solutions. In addition to its own platform, Stader’s modular smart contracts and staking middleware infrastructure for Proof-of-Stake (PoS) networks can be leveraged for retail crypto users, exchanges, custodians, and mainstream FinTech players Our Project - Stader Liquid staking helps us build a future where community members will no longer have to choose between securing the network through staking or participating in the thriving DeFi, NFT and gaming protocols on Polygon. Instead, users can access both staking and DeFi rewards using the liquid token across liquidity pools, yield farming, lending and borrowing. Stader provides a convenient way for the community to stake with multiple validators at once, helping them reduce risk & costs while increasing returns. Our liquid staking solution allows users to stake Matic and get a fungible liquid token MaticX that shows their claim to the underlying staked assets. The MaticX token can be leveraged on the multiple Defi opportunities.",
      },
    },
    permissions: [
      "account.list",
      "account.request",
      "currency.list",
      "message.sign",
      "transaction.signAndBroadcast",
    ],
    domains: ["https://"],
    visibility: "complete",
  },
];

function getManifests() {
  let manifests: AppManifest[] = [];

  for (let i = 0; i < 14; i++) {
    manifests = manifests.concat(
      mocks.map(manifest => {
        return {
          ...manifest,
          id: `${manifest.id}-${i}`,
        };
      }),
    );
  }

  return manifests;
}

export const manifests = getManifests();
