export const ONEINCH_MANIFEST = `{
  "$schema": "https://live-app-catalog.ledger.com/schema.json",
  "id": "1inch local",
  "name": "1inch local",
  "url": "https://dapp-browser.apps.ledger.com/v2/",
  "params": {
    "dappUrl": "https://app.1inch.io/?ledgerLive=true",
    "nanoApp": "1inch",
    "dappName": "1inch lld dappname",
    "networks": []
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
  "visibility": "complete"
}`;

export const ONEINCH_MANIFEST_V3 = `{
  "id": "1inch local",
  "author": "",
  "private": false,
  "name": "1inch local",
  "url": "https://app.1inch.io/?ledgerLive=true",
  "homepageUrl": "https://app.1inch.io/?ledgerLive=true",
  "icon": "",
  "platforms": [
    "ios",
    "android",
    "desktop"
  ],
  "apiVersion": "^2.0.0",
  "manifestVersion": "2",
  "branch": "stable",
  "categories": [
    "DeFi"
  ],
  "currencies": [
    "ethereum"
  ],
  "highlight": false,
  "content": {
    "description": {
      "en": "description"
    },
    "shortDescription": {
      "en": "shortDescription"
    }
  },
  "domains": [
    "http://*"
  ],
  "visibility": "complete",
  "permissions": []
}`;

export const ONEINCH_MANIFEST_BUST = `{
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
  "visibility": "complete"
}`;

export const ONEINCH_MANIFEST_NOCACHE = `{
  "$schema": "https://live-app-catalog.ledger.com/schema.json",
  "id": "1inch local",
  "name": "1inch local",
  "url": "https://dapp-browser.apps.ledger.com/v2/",
  "nocache": true,
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
  "visibility": "complete"
}`;
