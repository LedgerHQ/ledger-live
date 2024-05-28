import { LiveAppManifest } from "@ledgerhq/live-common/platform/types";

export const DEFAULT_VALUES = {
  permissions: [
    "account.list",
    "account.receive",
    "account.request",
    "currency.list",
    "message.sign",
    "transaction.sign",
    "transaction.signAndBroadcast",
    "wallet.capabilities",
    "wallet.info",
    "wallet.userId",
    "storage.get",
    "storage.set",
  ],
  visibility: ["complete", "searchable", "deep"],
  branch: ["stable", "experimental", "soon", "debug"],
  platforms: ["ios", "android", "desktop"],
  categories: [""],
  provider: ["evm"],
  currencies: [""],
};

export const DEFAULT_FORM: LiveAppManifest = {
  id: "ReplaceAppName",
  author: "",
  private: false,
  name: "ReplaceAppName",
  url: "http://localhost:3000",
  homepageUrl: "http://localhost:3000/",
  icon: "",
  platforms: ["ios", "android", "desktop"],
  apiVersion: "^2.0.0",
  manifestVersion: "2",
  branch: "stable",
  categories: ["DeFi"],
  currencies: ["ethereum"],
  highlight: false,
  content: {
    description: {
      en: "description",
    },
    shortDescription: {
      en: "shortDescription",
    },
  },
  domains: ["http://*"],
  visibility: "complete",
  permissions: [],
  dapp: {
    provider: "evm",
    nanoApp: "Ethereum",
    networks: [
      {
        currency: "ethereum",
        chainID: 1,
        nodeURL: "https://eth-dapps.api.live.ledger.com",
      },
    ],
  },
};

export const DESCRIPTIONS: Record<string, string> = {
  name: "Live App name as it will appear in the Discover section.",
  url: "The URL that will be loaded by the viewport.",
  homepageUrl:
    "Organization's URL, displayed in the info section and the top bar browser input on mobile.",
  icon: "App icon's URL.",
  platforms: "Platform compatibility.",
  apiVersion: "The specific manifest schema version your app uses (leave as default).",
  manifestVersion: "The manifest version supported by the app (leave as default).",
  categories:
    "Categories related to your Live App, helping users find it in the Discover section by filtering.",
  currencies: "Currencies supported by your Live App.",
  shortDescription:
    "A brief summary of your Live App, featured in the discovery section, right under the app's title.",
  description:
    "A detailed description of your Live App, displayed within the information section once the app is accessed.",
  visibility:
    "Live App's visibility ('searchable' means it appears only when the user searches for it in the Discover section, 'deep' won't be visible).",
  permissions: "List of permissions your app requires to interact with the Ledger Wallet API.",
  domains: "List of domains associated with your Live App.",
  branch: "The development stage of the app; only 'stable' will be displayed by default.",
  private: "If true, your Live App won't be published through the manifest API.",
  highlight: "Indicates if the app is featured.",
  provider: "DApp platform provider.",
  nanoApp: "Identifier for the app on the user's device.",
};
