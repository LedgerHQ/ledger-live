import {
  ADD_ACCOUNT_EVENTS_NAME,
  ADD_ACCOUNT_PAGE_NAME,
  type AddAccountEventParams,
} from "LLD/features/AddAccountDrawer/analytics/addAccount.types";

export const ALEO_ADD_ACCOUNT_EVENTS_NAME = {
  ...ADD_ACCOUNT_EVENTS_NAME,
  VIEW_KEY_WARNING: "confirm view key warning",
  VIEW_KEY_APPROVE: "approve view key share",
} as const;

export type AleoAddAccountEventName =
  (typeof ALEO_ADD_ACCOUNT_EVENTS_NAME)[keyof typeof ALEO_ADD_ACCOUNT_EVENTS_NAME];

export type AleoAddAccountEventsParams = AddAccountEventParams & {
  [ALEO_ADD_ACCOUNT_EVENTS_NAME.VIEW_KEY_APPROVE]: {
    source: string;
    flow: string;
  };
  [ALEO_ADD_ACCOUNT_EVENTS_NAME.VIEW_KEY_WARNING]: {
    source: string;
    flow: string;
  };
};

export const ALEO_ADD_ACCOUNT_PAGE_NAME = {
  ...ADD_ACCOUNT_PAGE_NAME,
  VIEW_KEY_WARNING: "confirm view key warning",
  VIEW_KEY_APPROVE: "approve view key share",
} as const;

export type AleoAddAccountPageName =
  (typeof ALEO_ADD_ACCOUNT_PAGE_NAME)[keyof typeof ALEO_ADD_ACCOUNT_PAGE_NAME];
