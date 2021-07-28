// @flow
import type { AppManifest } from "../../types";
import type { PlatformApi } from "../types";

const manifest: AppManifest[] = [
  {
    id: "paraswap",
    name: "ParaSwap",
    url:
      "https://ledger-live-platform-apps.vercel.app/app/dapp-browser?url=https%3A%2F%2Fparaswap.io%2F%3Fembed%3Dtrue%26referrer%3Dledger2&nanoApp=Paraswap&dappName=ParaSwap",
    homepageUrl: "https://paraswap.io",
    supportUrl: "https://paraswap.io",
    icon: "https://cdn.live.ledger.com/icons/platform/paraswap.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "stable",
    params: ["accountId"],
    categories: ["swap", "defi"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en:
          "Swap your crypto with ParaSwap that aggregates and provides the best quotes decentralised exchanges.",
      },
      description: {
        en:
          "Swap your crypto with ParaSwap that aggregates and provides the best quotes decentralised exchanges.",
      },
    },
    permissions: [
      {
        method: "account.list",
        params: {
          currencies: ["ethereum"],
        },
      },
      {
        method: "account.request",
        params: {
          currencies: ["ethereum"],
        },
      },
      {
        method: "transaction.sign",
        params: {
          nanoApp: ["paraswap"],
        },
      },
      {
        method: "transaction.broadcast",
      },
    ],
    domains: ["https://*"],
  },
  {
    id: "lido",
    name: "Lido",
    url:
      "https://ledger-live-platform-apps.vercel.app/app/dapp-browser?dappName=Lido&nanoApp=Lido&url=https%3A%2F%2Fstake.lido.fi%2F%3Fref%3D0x558247e365be655f9144e1a0140D793984372Ef3%26embed%3Dtrue",
    homepageUrl: "https://lido.fi/",
    icon: "https://cdn.live.ledger.com/icons/platform/lido.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "stable",
    categories: ["staking", "defi"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en: "Stake your ETH with Lido to earn daily staking rewards.",
      },
      description: {
        en: "Stake your ETH with Lido to earn daily staking rewards.",
      },
    },
    permissions: [],
    domains: ["https://*"],
  },
  {
    id: "wyre_buy",
    name: "Wyre",
    url: "https://ledger-live-platform-apps.vercel.app/app/wyre",
    homepageUrl: "https://www.sendwyre.com/",
    icon: "https://cdn.live.ledger.com/icons/platform/wyre.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "stable",
    categories: ["exchange", "buy"],
    currencies: ["ethereum", "bitcoin"],
    content: {
      shortDescription: {
        en:
          "Purchase Bitcoin, Ethereum and more crypto with Wyre, only available to our US customers.",
      },
      description: {
        en:
          "Purchase Bitcoin, Ethereum and more crypto with Wyre, only available to our US customers.",
      },
    },
    permissions: [
      {
        method: "account.request",
        params: {
          currencies: ["ethereum", "bitcoin"],
        },
      },
    ],
    domains: ["https://*"],
  },
  {
    id: "zerion",
    name: "Zerion",
    url:
      "https://ledger-live-platform-apps.vercel.app/app/dapp-browser?dappName=Zerion&nanoApp=Paraswap&url=https%3A%2F%2Fapp.zerion.io%2F%3Fembed%3Dledgerdappbrowser",
    homepageUrl: "https://zerion.io/",
    icon: "https://cdn.live.ledger.com/icons/platform/zerion.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "stable",
    categories: ["portfolio", "defi"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en: "The smart way to manage your DeFi portfolio.",
      },
      description: {
        en: "The smart way to manage your DeFi portfolio.",
      },
    },
    permissions: [],
    domains: ["https://*"],
  },
  {
    id: "rainbow",
    name: "Rainbow.me",
    url:
      "https://ledger-live-platform-apps.vercel.app/app/web-browser?url=https%3A%2F%2Frainbow.me%2F%7Baccount.address%7D&currencies=ethereum&webAppName=Rainbow.me",
    homepageUrl: "https://rainbow.me",
    icon: "https://cdn.live.ledger.com/icons/platform/rainbow.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "stable",
    categories: ["nft"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en: "An easy way to visualize the NFT secured by your hardware wallet.",
      },
      description: {
        en: "An easy way to visualize the NFT secured by your hardware wallet.",
      },
    },
    permissions: [],
    domains: ["https://*"],
  },
  {
    id: "aave",
    name: "Aave",
    url: "",
    homepageUrl: "https://aave.com/",
    icon: "https://cdn.live.ledger.com/icons/platform/aave.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "soon",
    categories: ["lend"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en:
          "Lend or Borrow your crypto through a liquidity market protocol and stay in control of your funds.",
      },
      description: {
        en:
          "Lend or Borrow your crypto through a liquidity market protocol and stay in control of your funds.",
      },
    },
    permissions: [],
    domains: [],
  },
  {
    id: "compound",
    name: "Compound",
    url: "",
    homepageUrl: "https://compound.finance/",
    icon: "https://cdn.live.ledger.com/icons/platform/compound.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "soon",
    categories: ["lend", "compound"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en:
          "Lend or Borrow your crypto via a completely decentralized and open-source protocol.",
      },
      description: {
        en:
          "Lend or Borrow your crypto via a completely decentralized and open-source protocol.",
      },
    },
    permissions: [],
    domains: [],
  },
  {
    id: "deversifi",
    name: "DeversiFi",
    url: "",
    homepageUrl: "https://www.deversifi.com/",
    icon: "https://cdn.live.ledger.com/icons/platform/deversifi.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "soon",
    categories: ["dex"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en:
          "Trade through a self-custody decentralized exchange on Ethereum layer-2.",
      },
      description: {
        en:
          "Trade through a self-custody decentralized exchange on Ethereum layer-2.",
      },
    },
    permissions: [],
    domains: [],
  },
  {
    id: "1inch",
    name: "1Inch",
    url: "",
    homepageUrl: "https://1inch.io/",
    icon: "https://cdn.live.ledger.com/icons/platform/1inch.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "soon",
    categories: ["swap", "defi"],
    currencies: ["ethereum"],
    content: {
      shortDescription: {
        en: "Exchange crypto via a Defi/DEX aggregator on Ethereum.",
      },
      description: {
        en: "Exchange crypto via a Defi/DEX aggregator on Ethereum.",
      },
    },
    permissions: [],
    domains: [],
  },
  {
    id: "debug",
    name: "Debugger",
    url: "https://ledger-live-platform-apps.vercel.app/app/debug",
    homepageUrl: "https://developers.ledger.com/",
    icon: "https://cdn.live.ledger.com/icons/platform/debugger.png",
    platform: "all",
    apiVersion: "0.0.1",
    manifestVersion: "1",
    branch: "debug",
    categories: ["tools"],
    currencies: "*",
    content: {
      shortDescription: {
        en:
          "Try out the Ledger Live API to test capabilities of our platform integration solution. Use at your own risk.",
      },
      description: {
        en:
          "Try out the Ledger Live API to test capabilities of our platform integration solution. Use at your own risk.",
      },
    },
    permissions: [
      {
        method: "*",
      },
    ],
    domains: ["https://*"],
  },
];

async function fetchManifest(): Promise<AppManifest[]> {
  return Promise.resolve(manifest);
}

const api: PlatformApi = {
  fetchManifest,
};

export default api;
