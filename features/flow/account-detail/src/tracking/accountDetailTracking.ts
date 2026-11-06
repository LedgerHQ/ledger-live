/** The `page` values of the plan: the account page, its settings and the removal confirmation. */
export const ACCOUNT_DETAIL_PAGES = {
  account: "Account",
  settings: "Account Settings",
  removeAccount: "Remove Account",
} as const;

export type AccountDetailPage = (typeof ACCOUNT_DETAIL_PAGES)[keyof typeof ACCOUNT_DETAIL_PAGES];

export const ACCOUNT_DETAIL_EVENTS = {
  pageAccount: "Page Account",
  pageSettings: "Page Account Settings",
  buttonClicked: "button_clicked",
  transactionClicked: "transaction_clicked",
  assetClicked: "asset_clicked",
} as const;

/** The `button` values of the plan. Quick actions send the id of the action (`send`, `receive`...). */
export const ACCOUNT_DETAIL_BUTTONS = {
  seeAllTransactions: "see all transactions",
  accountSettings: "account settings",
  editAccountName: "edit account name",
  validateEditAccountName: "validate edit account name",
  viewLogs: "view logs",
  copyLogs: "copy logs",
  viewInExplorer: "view in explorer",
  removeFromPortfolio: "remove from portfolio",
  validateRemoveFromPortfolio: "validate remove from portfolio",
  cancelRemoveFromPortfolio: "cancel remove from portfolio",
  pullToRefresh: "pull to refresh",
  analyticsBanner: "Analytics banner",
} as const;

export type AccountDetailButton =
  (typeof ACCOUNT_DETAIL_BUTTONS)[keyof typeof ACCOUNT_DETAIL_BUTTONS];

export type QuickActionButton =
  | "send"
  | "receive"
  | "swap"
  | "buy"
  | "sell"
  | "earn"
  | "transfer"
  | "More";

/** `quick_action_transfer` is for the actions picked inside the Transfer sheet. */
export type QuickActionLocation = "quick_action" | "quick_action_transfer";

/** What the plan puts on every event of the page and of its settings. */
export type AccountTrackingFacts = Readonly<{ networkId: string }>;

export const accountTrackingProps = ({ networkId }: AccountTrackingFacts) => ({
  network: networkId,
});

export type AccountPageViewFacts = AccountTrackingFacts &
  Readonly<{
    /** The page the user comes from (Accounts, Asset, Portfolio, Operation Details...). */
    source: string;
    operationsCount: number;
    hasTokens: boolean;
    hasAnalyticsBanner: boolean;
  }>;

export const accountPageViewProps = ({
  source,
  operationsCount,
  hasTokens,
  hasAnalyticsBanner,
  ...facts
}: AccountPageViewFacts) => ({
  ...accountTrackingProps(facts),
  source,
  operationsCount,
  hasTokens,
  hasAnalyticsBanner,
});

/** The settings are opened from the account page, so they only carry it as `source`. */
export const accountSettingsPageViewProps = (facts: AccountTrackingFacts) => ({
  ...accountTrackingProps(facts),
  source: ACCOUNT_DETAIL_PAGES.account,
});

export const accountButtonClickedProps = (
  facts: AccountTrackingFacts,
  button: AccountDetailButton,
  page: AccountDetailPage = ACCOUNT_DETAIL_PAGES.account,
) => ({ ...accountTrackingProps(facts), button, page });

export const quickActionClickedProps = (
  facts: AccountTrackingFacts,
  button: QuickActionButton,
  buttonLocation: QuickActionLocation = "quick_action",
) => ({
  ...accountTrackingProps(facts),
  button,
  page: ACCOUNT_DETAIL_PAGES.account,
  buttonLocation,
});

export const accountAssetClickedProps = (facts: AccountTrackingFacts, assetTicker: string) => ({
  ...accountTrackingProps(facts),
  asset: assetTicker,
  page: ACCOUNT_DETAIL_PAGES.account,
});

export const accountTransactionClickedProps = (
  facts: AccountTrackingFacts,
  operationType: string,
) => ({
  ...accountTrackingProps(facts),
  transaction: operationType,
  page: ACCOUNT_DETAIL_PAGES.account,
});

export const accountPullToRefreshProps = (
  facts: AccountTrackingFacts,
  triggeredAfterSyncError: boolean,
) => ({
  ...accountButtonClickedProps(facts, ACCOUNT_DETAIL_BUTTONS.pullToRefresh),
  triggeredAfterSyncError,
});
