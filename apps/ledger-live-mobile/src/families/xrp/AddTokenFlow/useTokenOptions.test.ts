import { renderHook } from "@testing-library/react-native";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { useTokensData } from "@features/platform-currencies";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { filterTokenOptions, useTokenOptions } from "./useTokenOptions";
import { XRP_ACCOUNT, XRP_ACCOUNT_WITH_TOKEN } from "../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => {
  return {
    ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});

jest.mock("@features/platform-currencies", () => ({ useTokensData: jest.fn() }));

const mockGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);

const MAINNET_TOKEN = {
  ...xrpIouToken,
  id: "ripple/iou/rlusd",
  parentCurrencyId: "ripple",
} as TokenCurrency;

describe("filterTokenOptions", () => {
  beforeEach(() => {
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
  });

  it("keeps only the tokens of the account's network", () => {
    expect(filterTokenOptions([xrpIouToken, MAINNET_TOKEN], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });

  it("keeps only the tokens whose standard is enabled", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou"]);

    expect(filterTokenOptions([xrpIouToken, xrpMptToken], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });

  it("lists nothing when no standard is enabled", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);

    expect(filterTokenOptions([xrpIouToken, xrpMptToken], XRP_ACCOUNT)).toEqual([]);
  });

  it("drops a delisted token", () => {
    const delisted = { ...xrpMptToken, delisted: true };

    expect(filterTokenOptions([xrpIouToken, delisted], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });

  it("drops a token the account issues", () => {
    const ownToken = { ...xrpMptToken, contractAddress: XRP_ACCOUNT.freshAddress };

    expect(filterTokenOptions([xrpIouToken, ownToken], XRP_ACCOUNT)).toEqual([xrpIouToken]);
  });

  it("keeps a held token", () => {
    expect(filterTokenOptions([xrpIouToken], XRP_ACCOUNT_WITH_TOKEN)).toEqual([xrpIouToken]);
  });
});

describe("useTokenOptions", () => {
  const loadNext = jest.fn();

  function mockTokensPage(tokens: TokenCurrency[]) {
    jest.mocked(useTokensData).mockReturnValue({
      data: { tokens, pagination: { nextCursor: "next" } },
      isLoading: false,
      isError: false,
      loadNext,
      refetch: jest.fn(),
    } as unknown as ReturnType<typeof useTokensData>);
  }

  beforeEach(() => {
    loadNext.mockClear();
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
  });

  it("keeps loading pages while each new page has no eligible token", () => {
    mockTokensPage([MAINNET_TOKEN]);
    const { rerender } = renderHook(() => useTokenOptions(XRP_ACCOUNT));

    mockTokensPage([
      MAINNET_TOKEN,
      { ...MAINNET_TOKEN, id: TokenCurrencyIdSchema.parse("ripple/iou/other") },
    ]);
    rerender({});

    expect(loadNext).toHaveBeenCalledTimes(2);
  });
});
