export const EVENTS_NAME = {
  MODULAR_ASSET_SELECTION: "Asset Selection",
  MODULAR_NETWORK_SELECTION: "Network Selection",
  MODULAR_ACCOUNT_SELECTION: "Account Selection",
  MODULAR_FUND_ACCOUNT_LIST: "Fund Account Drawer List",
  ASSET_CLICKED: "asset_clicked",
  NETWORK_CLICKED: "network_clicked",
  ACCOUNT_CLICKED: "account_clicked",
  ASSET_SEARCHED: "asset_searched",
  BUTTON_CLICKED: "button_clicked",
} as const;

export type ModularDrawerEventName = (typeof EVENTS_NAME)[keyof typeof EVENTS_NAME];

type ModularDrawerAssetComponentFeatures = {
  balance: boolean;
  market_trends: boolean;
  APY: boolean;
  filter: boolean;
};

type ModularDrawerNetworkComponentFeatures = {
  balance: boolean;
};

export type ModularDrawerEventParams = {
  [EVENTS_NAME.MODULAR_ASSET_SELECTION]: {
    flow: string;
    source: string;
    formatAssetConfig?: boolean;
    asset_component_features?: ModularDrawerAssetComponentFeatures;
  };
  [EVENTS_NAME.MODULAR_NETWORK_SELECTION]: {
    flow: string;
    source: string;
    formatNetworkConfig?: boolean;
    network_component_features?: ModularDrawerNetworkComponentFeatures;
  };
  [EVENTS_NAME.MODULAR_ACCOUNT_SELECTION]: {
    flow: string;
    source: string;
  };
  [EVENTS_NAME.MODULAR_FUND_ACCOUNT_LIST]: {
    flow: string;
    source: string;
  };
  [EVENTS_NAME.ASSET_CLICKED]: {
    flow: string;
    source: string;
    asset: string;
    page: string;
    formatAssetConfig?: boolean;
    asset_component_features?: ModularDrawerAssetComponentFeatures;
  };
  [EVENTS_NAME.NETWORK_CLICKED]: {
    flow: string;
    source: string;
    network: string;
    page: string;
    formatNetworkConfig?: boolean;
    network_component_features?: ModularDrawerNetworkComponentFeatures;
  };
  [EVENTS_NAME.ACCOUNT_CLICKED]: {
    flow: string;
    source: string;
    currency: string;
    page: string;
  };
  [EVENTS_NAME.ASSET_SEARCHED]: {
    flow: string;
    source: string;
    formatAssetConfig?: boolean;
    asset_component_features?: ModularDrawerAssetComponentFeatures;
    searched_value: string;
    page: string;
  };
  [EVENTS_NAME.BUTTON_CLICKED]: {
    flow: string;
    source?: string;
    page: string;
    button: string;
  };
};

export const MODULAR_DRAWER_PAGE_NAME = {
  MODULAR_ASSET_SELECTION: "Asset Selection",
  MODULAR_NETWORK_SELECTION: "Network Selection",
  MODULAR_ACCOUNT_SELECTION: "Account Selection",
  FUND_ACCOUNT_LIST: "Fund Account Drawer List",
} as const;

export type ModularDrawerPageName =
  (typeof MODULAR_DRAWER_PAGE_NAME)[keyof typeof MODULAR_DRAWER_PAGE_NAME];

export const MAD_SOURCE_PAGES = {
  ACCOUNTS_PAGE: "Accounts",
};
