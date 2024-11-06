export const ONEINCH_MANIFEST_NOCACHE = `{
  "$schema": "https://live-app-catalog.ledger.com/schema.json",
  "id": "1inch local",
  "name": "1inch local",
  "url": "https://dapp-browser.apps.ledger.com/v2/",
  "params": {
    "dappUrl": "https://app.1inch.io/?ledgerLive=true",
    "nanoApp": "1inch",
    "dappName": "1inch lld dappname",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      },
      {
        "currency": "bsc",
        "chainID": 56,
        "nodeURL": "https://bsc-dataseed.binance.org/"
      },
      {
        "currency": "polygon",
        "chainID": 137,
        "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
      }
    ]
  },
  "homepageUrl": "https://1inch.io/",
  "icon": "https://cdn.live.ledger.com/icons/platform/1inch.png",
  "platforms": ["android", "ios", "desktop"],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": ["swap"],
  "currencies": ["ethereum", "bsc", "polygon"],
  "content": {
    "shortDescription": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    },
    "description": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    }
  },
  "permissions": [
    "account.list",
    "account.request",
    "currency.list",
    "message.sign",
    "transaction.signAndBroadcast"
  ],
  "domains": ["https://"],
  "visibility": "complete",
  "overrides": [
    {
      "version": "^3.33.0",
      "platform": "android",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local mobile",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^3.33.0",
      "platform": "ios",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^2.71.0",
      "platform": "desktop",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    }
  ]
}`;

export const ONEINCH_MANIFEST_CACHE = `{
  "$schema": "https://live-app-catalog.ledger.com/schema.json",
  "id": "1inch local",
  "name": "1inch local",
  "url": "https://dapp-browser.apps.ledger.com/v2/",
  "cacheBustingId": 1,
  "params": {
    "dappUrl": "https://app.1inch.io/?ledgerLive=true",
    "nanoApp": "1inch",
    "dappName": "1inch lld dappname",
    "networks": [
      {
        "currency": "ethereum",
        "chainID": 1,
        "nodeURL": "https://eth-dapps.api.live.ledger.com"
      },
      {
        "currency": "bsc",
        "chainID": 56,
        "nodeURL": "https://bsc-dataseed.binance.org/"
      },
      {
        "currency": "polygon",
        "chainID": 137,
        "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
      }
    ]
  },
  "homepageUrl": "https://1inch.io/",
  "icon": "https://cdn.live.ledger.com/icons/platform/1inch.png",
  "platforms": ["android", "ios", "desktop"],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": ["swap"],
  "currencies": ["ethereum", "bsc", "polygon"],
  "content": {
    "shortDescription": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    },
    "description": {
      "en": "Exchange crypto via a Defi/DEX aggregator on Ethereum mainnet, BSC or Polygon"
    }
  },
  "permissions": [
    "account.list",
    "account.request",
    "currency.list",
    "message.sign",
    "transaction.signAndBroadcast"
  ],
  "domains": ["https://"],
  "visibility": "complete",
  "overrides": [
    {
      "version": "^3.33.0",
      "platform": "android",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local mobile",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^3.33.0",
      "platform": "ios",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    },
    {
      "version": "^2.71.0",
      "platform": "desktop",
      "changes": {
        "currencies": [
          "ethereum",
          "bsc",
          "polygon",
          "base",
          "fantom",
          "arbitrum",
          "optimism"
        ],
        "params": {
          "dappUrl": "https://app.1inch.io/?ledgerLive=true",
          "nanoApp": "1inch",
          "dappName": "1inch local",
          "networks": [
            {
              "currency": "ethereum",
              "chainID": 1,
              "nodeURL": "https://eth-dapps.api.live.ledger.com"
            },
            {
              "currency": "bsc",
              "chainID": 56,
              "nodeURL": "https://bsc-dataseed.binance.org/"
            },
            {
              "currency": "polygon",
              "chainID": 137,
              "nodeURL": "https://polygon-mainnet.g.alchemy.com/v2/oPIxZM7kXsPVVY1Sk0kOQwkoIOpSu8PE"
            },
            {
              "currency": "base",
              "chainID": 8453,
              "nodeURL": "https://developer-access-mainnet.base.org"
            },
            {
              "currency": "optimism",
              "chainID": 10,
              "nodeURL": "https://mainnet.optimism.io"
            },
            {
              "currency": "arbitrum",
              "chainID": 42161,
              "nodeURL": "https://arb1.arbitrum.io/rpc"
            },
            {
              "currency": "fantom",
              "chainID": 250,
              "nodeURL": "https://rpcapi.fantom.network"
            }
          ]
        }
      }
    }
  ]
}`;
