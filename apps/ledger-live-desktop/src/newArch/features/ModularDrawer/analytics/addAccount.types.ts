export const ADD_ACCOUNT_EVENTS_NAME = {
  ADD_ACCOUNT_BUTTON_CLICKED: "button_clicked",
  ADD_ACCOUNT_ACCOUNT_CLICKED: "account_clicked",
  ACCOUNT_ADDED: "account_added",
  LOOKING_FOR_ACCOUNTS: "looking for accounts",
  ADD_ACCOUNTS_SUCCESS: "add account success",
  FUND_ACCOUNT_DRAWER_LIST: "fund account drawer list",
  FUNDING_ACTIONS: "add account funding actions",
  CANT_ADD_NEW_ACCOUNT: "cant add new account",
  DEVICE_CONNECTION: "device connection",
} as const;

export type AddAccountEventName =
  (typeof ADD_ACCOUNT_EVENTS_NAME)[keyof typeof ADD_ACCOUNT_EVENTS_NAME];

export type AddAccountEventParams = {
  [ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_BUTTON_CLICKED]: {
    button: string;
    page: string;
    flow?: string;
  };
  [ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNT_ACCOUNT_CLICKED]: {
    account: string;
    currency: string;
    page: string;
    flow: string;
  };
  [ADD_ACCOUNT_EVENTS_NAME.ACCOUNT_ADDED]: {
    currency: string;
    amount: number;
  };
  [ADD_ACCOUNT_EVENTS_NAME.LOOKING_FOR_ACCOUNTS]: {
    source: string;
    flow: string;
  };
  [ADD_ACCOUNT_EVENTS_NAME.ADD_ACCOUNTS_SUCCESS]: {
    source: string;
  };
  [ADD_ACCOUNT_EVENTS_NAME.FUND_ACCOUNT_DRAWER_LIST]: {
    source: string;
    flow: string;
  };
  [ADD_ACCOUNT_EVENTS_NAME.FUNDING_ACTIONS]: {
    source: string;
    flow: string;
  };
  [ADD_ACCOUNT_EVENTS_NAME.CANT_ADD_NEW_ACCOUNT]: {
    source: string;
    reason: string;
  };
  [ADD_ACCOUNT_EVENTS_NAME.DEVICE_CONNECTION]: {
    source: string;
    flow: string;
  };
};

export const ADD_ACCOUNT_PAGE_NAME = {
  LOOKING_FOR_ACCOUNTS: "looking for accounts",
  ADD_ACCOUNTS_SUCCESS: "add account success",
  FUND_ACCOUNT_DRAWER_LIST: "fund account drawer list",
  FUNDING_ACTIONS: "add account funding actions",
  CANT_ADD_NEW_ACCOUNT: "cant add new account",
  DEVICE_CONNECTION: "device connection",
} as const;

export type AddAccountPageName = (typeof ADD_ACCOUNT_PAGE_NAME)[keyof typeof ADD_ACCOUNT_PAGE_NAME];

export const ADD_ACCOUNT_FLOW_NAME = "Add account";
