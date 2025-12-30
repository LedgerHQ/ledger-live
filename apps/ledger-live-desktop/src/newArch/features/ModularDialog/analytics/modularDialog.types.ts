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

export type ModularDialogEventName = (typeof EVENTS_NAME)[keyof typeof EVENTS_NAME];

type ModularDialogAssetComponentFeatures = {
  balance: boolean;
  market_trends: boolean;
  APY: boolean;
  filter: boolean;
};

type ModularDialogNetworkComponentFeatures = {
  balance: boolean;
};

export type ModularDialogEventParams = {
  [EVENTS_NAME.MODULAR_ASSET_SELECTION]: {
    formatAssetConfig?: boolean;
    asset_component_features?: ModularDialogAssetComponentFeatures;
  };
  [EVENTS_NAME.MODULAR_NETWORK_SELECTION]: {
    formatNetworkConfig?: boolean;
    network_component_features?: ModularDialogNetworkComponentFeatures;
  };
  [EVENTS_NAME.MODULAR_ACCOUNT_SELECTION]: object;
  [EVENTS_NAME.MODULAR_FUND_ACCOUNT_LIST]: object;
  [EVENTS_NAME.ASSET_CLICKED]: {
    asset: string;
    page: string;
    formatAssetConfig?: boolean;
    asset_component_features?: ModularDialogAssetComponentFeatures;
  };
  [EVENTS_NAME.NETWORK_CLICKED]: {
    network: string;
    page: string;
    formatNetworkConfig?: boolean;
    network_component_features?: ModularDialogNetworkComponentFeatures;
  };
  [EVENTS_NAME.ACCOUNT_CLICKED]: {
    currency: string;
    page: string;
  };
  [EVENTS_NAME.ASSET_SEARCHED]: {
    formatAssetConfig?: boolean;
    asset_component_features?: ModularDialogAssetComponentFeatures;
    searched_value: string;
    page: string;
  };
  [EVENTS_NAME.BUTTON_CLICKED]: {
    page: string;
    button: string;
  };
};

export const MODULAR_DIALOG_PAGE_NAME = {
  MODULAR_ASSET_SELECTION: "Asset Selection",
  MODULAR_NETWORK_SELECTION: "Network Selection",
  MODULAR_ACCOUNT_SELECTION: "Account Selection",
  FUND_ACCOUNT_LIST: "Fund Account Drawer List",
} as const;

export const MAD_SOURCE_PAGES = {
  ACCOUNTS_PAGE: "Accounts",
};
