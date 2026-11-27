import { getAssetManagementStateEvents } from "./tracking";

describe("getAssetManagementStateEvents", () => {
  it("names the toggles and hidden tokens list states on desktop", () => {
    expect(
      getAssetManagementStateEvents(
        {
          hideEmptyTokenAccounts: true,
          filterTokenOperationsZeroAmount: false,
          isHiddenTokensOpen: true,
        },
        "desktop",
      ),
    ).toEqual([
      { id: "hideEmptyTokenAccounts", event: "hideEmptyTokenAccountsEnabled" },
      { id: "filterTokenOperationsZeroAmount", event: "filterTokenOperationsZeroAmountDisabled" },
      { id: "hiddenTokens", event: "BlacklistedTokens dropdown", properties: { opened: true } },
    ]);
    expect(
      getAssetManagementStateEvents(
        {
          hideEmptyTokenAccounts: false,
          filterTokenOperationsZeroAmount: true,
          isHiddenTokensOpen: false,
        },
        "desktop",
      ),
    ).toEqual([
      { id: "hideEmptyTokenAccounts", event: "hideEmptyTokenAccountsDisabled" },
      { id: "filterTokenOperationsZeroAmount", event: "filterTokenOperationsZeroAmountEnabled" },
      { id: "hiddenTokens", event: "BlacklistedTokens dropdown", properties: { opened: false } },
    ]);
  });

  it("sends nothing on mobile, which never sent these events", () => {
    expect(
      getAssetManagementStateEvents(
        {
          hideEmptyTokenAccounts: true,
          filterTokenOperationsZeroAmount: true,
          isHiddenTokensOpen: true,
        },
        "mobile",
      ),
    ).toEqual([]);
  });
});
