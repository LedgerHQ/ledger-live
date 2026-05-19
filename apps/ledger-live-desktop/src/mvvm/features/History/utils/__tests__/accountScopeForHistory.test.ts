import {
  expandRequestedAccountIdsForHistoryScope,
  filterOperationTableItemsByAllowedAccountIds,
  filterTopLevelAccountsByAllowedAccountIds,
  parseAccountIdsSearchParam,
} from "../accountScopeForHistory";
import {
  BTC_ACCOUNT,
  ETH_ACCOUNT,
  ETH_ACCOUNT_WITH_USDC,
} from "LLD/features/__mocks__/accounts.mock";

const BTC_ACCOUNT_ID = BTC_ACCOUNT.id;
const ethWithUsdcUsdcId = ETH_ACCOUNT_WITH_USDC.subAccounts?.[0]?.id;
if (!ethWithUsdcUsdcId) {
  throw new Error("ETH_ACCOUNT_WITH_USDC fixture must include a USDC sub-account");
}

describe("parseAccountIdsSearchParam", () => {
  it("returns null for empty input", () => {
    expect(parseAccountIdsSearchParam(null)).toBe(null);
    expect(parseAccountIdsSearchParam("")).toBe(null);
    expect(parseAccountIdsSearchParam(", , ")).toBe(null);
  });

  it("parses comma-separated ids", () => {
    expect(parseAccountIdsSearchParam("a, b")).toEqual(["a", "b"]);
  });
});

describe("filterTopLevelAccountsByAllowedAccountIds", () => {
  it("keeps roots that contain at least one allowed id", () => {
    expect(
      filterTopLevelAccountsByAllowedAccountIds(
        [BTC_ACCOUNT, ETH_ACCOUNT],
        new Set([BTC_ACCOUNT_ID]),
      ).map(a => a.id),
    ).toEqual([BTC_ACCOUNT_ID]);
  });

  it("keeps a root when the allowed id is only a sub-account under that root", () => {
    expect(
      filterTopLevelAccountsByAllowedAccountIds(
        [BTC_ACCOUNT, ETH_ACCOUNT_WITH_USDC],
        new Set([ethWithUsdcUsdcId]),
      ).map(a => a.id),
    ).toEqual([ETH_ACCOUNT_WITH_USDC.id]);
  });
});

describe("expandRequestedAccountIdsForHistoryScope", () => {
  it("expands a portfolio root id to all flattened descendant account ids", () => {
    const expanded = expandRequestedAccountIdsForHistoryScope(
      [ETH_ACCOUNT_WITH_USDC],
      new Set([ETH_ACCOUNT_WITH_USDC.id]),
    );

    expect(expanded).toEqual(new Set([ETH_ACCOUNT_WITH_USDC.id, ethWithUsdcUsdcId]));
  });

  it("does not expand a token account id beyond that sub-account", () => {
    const expanded = expandRequestedAccountIdsForHistoryScope(
      [ETH_ACCOUNT_WITH_USDC],
      new Set([ethWithUsdcUsdcId]),
    );

    expect(expanded).toEqual(new Set([ethWithUsdcUsdcId]));
  });
});

describe("filterOperationTableItemsByAllowedAccountIds", () => {
  it("drops rows whose account id is outside the allowed set", () => {
    const rows: ReadonlyArray<{ account: { id: string } }> = [
      { account: { id: "keep" } },
      { account: { id: "drop" } },
    ];

    const filtered = filterOperationTableItemsByAllowedAccountIds(rows, new Set(["keep"]));

    expect(filtered).toHaveLength(1);
    expect(filtered[0].account.id).toBe("keep");
  });
});
