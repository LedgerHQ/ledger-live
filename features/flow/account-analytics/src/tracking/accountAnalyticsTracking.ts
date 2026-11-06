/** The `page` value of the plan for the Analytics screen. */
const ACCOUNT_ANALYTICS_PAGE = "Analytics";

export const ACCOUNT_ANALYTICS_EVENTS = {
  buttonClicked: "button_clicked",
  filterChanged: "filter_changed",
} as const;

/** The `button` sent when a dropdown opens and the `filter` sent when its value changes. */
export const ACCOUNT_ANALYTICS_FILTERS = {
  asset: { button: "asset filter", filter: "Asset" },
  account: { button: "account filter", filter: "Account" },
} as const;

export type AccountAnalyticsFilter =
  (typeof ACCOUNT_ANALYTICS_FILTERS)[keyof typeof ACCOUNT_ANALYTICS_FILTERS];

/** The value of the "All assets" and "All accounts" options, independent of the locale. */
export const ALL_FILTER_VALUE = "all";

export const filterOpenedProps = (filter: AccountAnalyticsFilter) => ({
  button: filter.button,
  page: ACCOUNT_ANALYTICS_PAGE,
});

export const filterChangedProps = (
  filter: AccountAnalyticsFilter,
  value: string,
  previousValue: string,
) => ({
  filter: filter.filter,
  page: ACCOUNT_ANALYTICS_PAGE,
  value,
  previousValue,
});
