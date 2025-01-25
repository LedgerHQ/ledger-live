export const DEFAULT_MANIFEST = `{
  "id": "metamask-test-dapsp",
  "name": "Metamask Test Dapp",
  "private": false,
  "url": "https://metamask.github.io/test-dapp/",
  "dapp": {
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
        "currency": "arbitrum",
        "chainID": 42161,
        "nodeURL": "https://arb1.arbitrum.io/rpc"
      },
      {
        "currency": "optimism",
        "chainID": 10,
        "nodeURL": "https://mainnet.optimism.io"
      }
    ]
  },
  "homepageUrl": "https://metamask.github.io/test-dapp/",
  "icon": "https://cdn.live.ledger.com/icons/platform/1inch.png",
  "platforms": ["android", "ios", "desktop"],
  "apiVersion": "^2.0.0",
  "manifestVersion": "1",
  "branch": "stable",
  "categories": ["tools"],
  "currencies": ["ethereum", "bsc", "polygon", "arbitrum", "optimism"],
  "content": {
    "shortDescription": {
      "en": "Metamask Test Dapp"
    },
    "description": {
      "en": "Metamask Test Dapp"
    }
  },
  "permissions": [],
  "domains": ["http://", "https://"],
  "visibility": "complete"
}`;
