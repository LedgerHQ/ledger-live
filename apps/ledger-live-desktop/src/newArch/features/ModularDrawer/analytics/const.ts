export const EVENTS_NAME = {
  MODULAR_ASSET_SELECTION: "Modular Asset Selection",
  MODULAR_NETWORK_SELECTION: "Modular Network Selection",
  MODULAR_ACCOUNT_SELECTION: "Modular Account Selection",
  ASSET_CLICKED: "asset_clicked",
  NETWORK_CLICKED: "network_clicked",
  ACCOUNT_CLICKED: "account_clicked",
  ASSET_SEARCHED: "asset_searched",
  BUTTON_CLICKED: "button_clicked",
} as const;

export type ModularDrawerEventName = (typeof EVENTS_NAME)[keyof typeof EVENTS_NAME];

export type ModularDrawerEventParams = {
  [EVENTS_NAME.MODULAR_ASSET_SELECTION]: {
    source: string;
    flow: string;
    component: string;
    toggle?: boolean;
  };
  [EVENTS_NAME.MODULAR_NETWORK_SELECTION]: {
    source: string;
    flow: string;
    toggle?: boolean;
  };
  [EVENTS_NAME.MODULAR_ACCOUNT_SELECTION]: {
    source: string;
    flow: string;
  };
  [EVENTS_NAME.ASSET_CLICKED]: {
    asset: string;
    page: string;
    flow: string;
  };
  [EVENTS_NAME.NETWORK_CLICKED]: {
    network: string;
    page: string;
    flow: string;
  };
  [EVENTS_NAME.ACCOUNT_CLICKED]: {
    currency: string;
    page: string;
    flow: string;
  };
  [EVENTS_NAME.ASSET_SEARCHED]: {
    asset: string;
    page: string;
    flow: string;
  };
  [EVENTS_NAME.BUTTON_CLICKED]: {
    button: string;
    page: string;
    flow: string;
  };
};
