export const MOCK_CURRENCY_BY_PROVIDER_ID = [
  {
    providerId: "ethereum",
    currenciesByNetwork: [
      {
        type: "CryptoCurrency",
        id: "ethereum",
        coinType: 60,
        name: "Ethereum",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "ethereum",
        color: "#0ebdcd",
        symbol: "Ξ",
        family: "evm",
        blockAvgTime: 15,
        units: [
          {
            name: "ether",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        ethereumLikeInfo: {
          chainId: 1,
        },
        explorerViews: [
          {
            tx: "https://etherscan.io/tx/$hash",
            address: "https://etherscan.io/address/$address",
            token: "https://etherscan.io/token/$contractAddress?a=$address",
          },
        ],
        keywords: ["eth", "ethereum"],
        explorerId: "eth",
      },
      {
        type: "CryptoCurrency",
        id: "zksync",
        coinType: 60,
        name: "ZKsync",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "zksync",
        color: "#000000",
        family: "evm",
        units: [
          {
            name: "ETH",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        ethereumLikeInfo: {
          chainId: 324,
        },
        explorerViews: [
          {
            tx: "https://zksync.blockscout.com/tx/$hash",
            address: "https://zksync.blockscout.com/address/$address",
            token:
              "https://zksync.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
          },
        ],
      },
      {
        type: "CryptoCurrency",
        id: "scroll",
        coinType: 60,
        name: "Scroll",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "scroll",
        color: "#ebc28e",
        family: "evm",
        units: [
          {
            name: "ETH",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        disableCountervalue: false,
        ethereumLikeInfo: {
          chainId: 534352,
        },
        explorerViews: [
          {
            tx: "https://scroll.blockscout.com/tx/$hash",
            address: "https://scroll.blockscout.com/address/$address",
            token:
              "https://scroll.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
          },
        ],
      },
      {
        type: "CryptoCurrency",
        id: "optimism",
        coinType: 60,
        name: "OP Mainnet",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "optimism",
        color: "#FF0421",
        family: "evm",
        units: [
          {
            name: "ether",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        ethereumLikeInfo: {
          chainId: 10,
        },
        explorerViews: [
          {
            tx: "https://optimism.blockscout.com/tx/$hash",
            address: "https://optimism.blockscout.com/address/$address",
            token:
              "https://optimism.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
          },
        ],
        keywords: ["optimism"],
      },
      {
        type: "CryptoCurrency",
        id: "linea",
        coinType: 60,
        name: "Linea",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "linea",
        color: "#000000",
        family: "evm",
        units: [
          {
            name: "ETH",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        disableCountervalue: false,
        ethereumLikeInfo: {
          chainId: 59144,
        },
        explorerViews: [
          {
            tx: "https://lineascan.build/tx/$hash",
            address: "https://lineascan.build/address/$address",
            token: "https://lineascan.build/token/$address",
          },
        ],
      },
      {
        type: "CryptoCurrency",
        id: "base",
        coinType: 60,
        name: "Base",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "base",
        color: "#1755FE",
        family: "evm",
        units: [
          {
            name: "ETH",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        ethereumLikeInfo: {
          chainId: 8453,
        },
        explorerViews: [
          {
            tx: "https://base.blockscout.com/tx/$hash",
            address: "https://base.blockscout.com/address/$address",
            token:
              "https://base.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
          },
        ],
      },
      {
        type: "CryptoCurrency",
        id: "arbitrum",
        coinType: 60,
        name: "Arbitrum",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "arbitrum",
        color: "#28a0f0",
        family: "evm",
        units: [
          {
            name: "ETH",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        ethereumLikeInfo: {
          chainId: 42161,
        },
        explorerViews: [
          {
            tx: "https://arbitrum.blockscout.com/tx/$hash",
            address: "https://arbitrum.blockscout.com/address/$address",
            token:
              "https://arbitrum.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
          },
        ],
      },
      {
        type: "CryptoCurrency",
        id: "blast",
        coinType: 60,
        name: "Blast",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "blast",
        color: "#FCFC06",
        family: "evm",
        units: [
          {
            name: "ETH",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        disableCountervalue: false,
        ethereumLikeInfo: {
          chainId: 81457,
        },
        explorerViews: [
          {
            tx: "https://blast.blockscout.com/tx/$hash",
            address: "https://blast.blockscout.com/address/$address",
            token:
              "https://blast.blockscout.com/address/$address?tab=token_transfer&token=$contractAddress",
          },
        ],
      },
      {
        type: "CryptoCurrency",
        id: "boba",
        coinType: 60,
        name: "Boba",
        managerAppName: "Ethereum",
        ticker: "ETH",
        scheme: "boba",
        color: "#CBFF00",
        family: "evm",
        units: [
          {
            name: "ETH",
            code: "ETH",
            magnitude: 18,
          },
          {
            name: "Gwei",
            code: "Gwei",
            magnitude: 9,
          },
          {
            name: "Mwei",
            code: "Mwei",
            magnitude: 6,
          },
          {
            name: "Kwei",
            code: "Kwei",
            magnitude: 3,
          },
          {
            name: "wei",
            code: "wei",
            magnitude: 0,
          },
        ],
        ethereumLikeInfo: {
          chainId: 288,
        },
        explorerViews: [
          {
            tx: "https://bobascan.com/tx/$hash",
            address: "https://bobascan.com/address/$address",
            token: "https://bobascan.com/token/$contractAddress?a=$address",
          },
        ],
      },
    ],
  },
];
