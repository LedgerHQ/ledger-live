export const ADD_ACCOUNT_EVENTS_NAME = {
  ACCOUNT_ADDED: "account_added",
  ADD_ACCOUNT_ACCOUNT_CLICKED: "account_clicked",
  ADD_ACCOUNT_BUTTON_CLICKED: "button_clicked",
  ADD_ACCOUNTS_SUCCESS: "add account success",
  CANT_ADD_NEW_ACCOUNT: "cant add new account",
  DEVICE_CONNECTION: "device connection",
  EDIT_NAME_ACTIONS: "add account edit name actions",
  FUND_ACCOUNT_DRAWER_LIST: "fund account drawer list",
  FUNDING_ACTIONS: "add account funding actions",
  LOOKING_FOR_ACCOUNTS: "looking for accounts",
  SELECT_ACCOUNT_TO_ADD: "select account to add",
} as const;

export type AddAccountEventName =
  (typeof ADD_ACCOUNT_EVENTS_NAME)[keyof typeof ADD_ACCOUNT_EVENTS_NAME];

export type AddAccountEventParams = {
  [ADD_ACCOUNT_EVENTS_NAME.SELECT_ACCOUNT_TO_ADD]: {
    source: string;
    flow: string;
  };
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
    isTokenAdd?: boolean;
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
  [ADD_ACCOUNT_EVENTS_NAME.EDIT_NAME_ACTIONS]: {
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
  ADD_ACCOUNTS_SUCCESS: "add account success",
  CANT_ADD_NEW_ACCOUNT: "cant add new account",
  DEVICE_CONNECTION: "device connection",
  EDIT_ACCOUNT_NAME_ACTIONS: "add account edit name actions",
  FUND_ACCOUNT_DRAWER_LIST: "fund account drawer list",
  FUNDING_ACTIONS: "add account funding actions",
  LOOKING_FOR_ACCOUNTS: "looking for accounts",
  SELECT_ACCOUNT_TO_ADD: "select account to add",
} as const;

export type AddAccountPageName = (typeof ADD_ACCOUNT_PAGE_NAME)[keyof typeof ADD_ACCOUNT_PAGE_NAME];

export const ADD_ACCOUNT_FLOW_NAME = "Add account";
