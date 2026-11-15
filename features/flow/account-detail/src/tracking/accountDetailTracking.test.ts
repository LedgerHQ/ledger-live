import {
  ACCOUNT_DETAIL_BUTTONS,
  ACCOUNT_DETAIL_PAGES,
  accountAssetClickedProps,
  accountButtonClickedProps,
  accountPageViewProps,
  accountPullToRefreshProps,
  accountSettingsPageViewProps,
  accountTrackingProps,
  accountTransactionClickedProps,
  quickActionClickedProps,
} from "./accountDetailTracking";

const facts = { networkId: "ethereum" };

describe("account detail tracking", () => {
  it("puts the network id on every payload", () => {
    expect(accountTrackingProps(facts)).toEqual({ network: "ethereum" });
  });

  it("describes the page view with where the user comes from and what the account holds", () => {
    expect(
      accountPageViewProps({
        ...facts,
        source: "Asset",
        operationsCount: 12,
        hasTokens: false,
        hasAnalyticsBanner: true,
      }),
    ).toEqual({
      network: "ethereum",
      source: "Asset",
      operationsCount: 12,
      hasTokens: false,
      hasAnalyticsBanner: true,
    });
  });

  it("opens the settings from the account page", () => {
    expect(accountSettingsPageViewProps(facts)).toEqual({
      ...accountTrackingProps(facts),
      source: "Account",
    });
  });

  it("sends the quick action with its location, on the account page", () => {
    expect(quickActionClickedProps(facts, "send")).toEqual({
      ...accountTrackingProps(facts),
      button: "send",
      page: "Account",
      buttonLocation: "quick_action",
    });
    expect(quickActionClickedProps(facts, "receive", "quick_action_transfer").buttonLocation).toBe(
      "quick_action_transfer",
    );
  });

  it("sends a button click on the account page by default, and on the page it is on otherwise", () => {
    expect(accountButtonClickedProps(facts, ACCOUNT_DETAIL_BUTTONS.accountSettings)).toMatchObject({
      button: "account settings",
      page: "Account",
    });
    expect(
      accountButtonClickedProps(
        facts,
        ACCOUNT_DETAIL_BUTTONS.validateRemoveFromPortfolio,
        ACCOUNT_DETAIL_PAGES.removeAccount,
      ),
    ).toMatchObject({ button: "validate remove from portfolio", page: "Remove Account" });
  });

  it("sends the ticker of a clicked asset and the type of a clicked transaction", () => {
    expect(accountAssetClickedProps(facts, "USDT")).toMatchObject({
      asset: "USDT",
      page: "Account",
    });
    expect(accountTransactionClickedProps(facts, "DELEGATE")).toMatchObject({
      transaction: "DELEGATE",
      page: "Account",
    });
  });

  it("tells whether the pull to refresh follows a sync error", () => {
    expect(accountPullToRefreshProps(facts, true)).toMatchObject({
      button: "pull to refresh",
      page: "Account",
      triggeredAfterSyncError: true,
    });
  });
});
