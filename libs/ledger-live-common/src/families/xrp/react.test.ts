/**
 * @jest-environment jsdom
 */
import { renderHook } from "@testing-library/react";
import { type TokenCurrency, TokenCurrencyIdSchema } from "@domain/entity-currency-token";
import { useTokensData } from "@features/platform-currencies";
import { getXrpEnabledTokenStandards } from "./config";
import { useTokenOptions } from "./react";
import { XRP_ACCOUNT } from "./__mocks__/xrpAccount.mock";
import { xrpIouToken, xrpMainnetToken } from "./__mocks__/xrpCurrency.mock";

jest.mock("./config", () => {
  return {
    ...jest.requireActual("./config"),
    getXrpEnabledTokenStandards: jest.fn(),
  };
});
const mockGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);
jest.mock("@features/platform-currencies", () => ({
  useTokensData: jest.fn(),
}));
const mockUseTokensData = jest.mocked(useTokensData);

describe("useTokenOptions", () => {
  const loadNext = jest.fn();
  const refetch = jest.fn();

  function mockTokens(tokens: TokenCurrency[] | undefined, hasMore: boolean) {
    mockUseTokensData.mockReturnValue({
      data: tokens && { tokens, pagination: {} },
      isLoading: false,
      isError: !tokens,
      loadNext: hasMore ? loadNext : undefined,
      refetch,
    } as unknown as ReturnType<typeof useTokensData>);
  }

  function renderTokenOptions(tokens: TokenCurrency[] | undefined, hasMore: boolean) {
    mockTokens(tokens, hasMore);

    return renderHook(() => useTokenOptions(XRP_ACCOUNT)).result;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
  });

  it("loads the next page while no loaded token fits the account", () => {
    const result = renderTokenOptions([xrpMainnetToken], true);

    expect(loadNext).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
  });

  it("keeps loading pages while each new page has no token for the account", () => {
    mockTokens([xrpMainnetToken], true);
    const { rerender } = renderHook(() => useTokenOptions(XRP_ACCOUNT));

    const otherToken = { ...xrpMainnetToken, id: TokenCurrencyIdSchema.parse("ripple/iou/other") };
    mockTokens([xrpMainnetToken, otherToken], true);
    rerender();

    expect(loadNext).toHaveBeenCalledTimes(2);
  });

  it("waits for a scroll once a token fits the account", () => {
    const result = renderTokenOptions([xrpIouToken, xrpMainnetToken], true);

    expect(loadNext).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ options: [xrpIouToken], isLoading: false });
  });

  it("ends the loading once no page is left", () => {
    const result = renderTokenOptions([xrpMainnetToken], false);

    expect(result.current).toMatchObject({ options: [], isLoading: false });
  });

  it("stops loading pages after a failed load", () => {
    const result = renderTokenOptions(undefined, true);

    expect(loadNext).not.toHaveBeenCalled();
    expect(result.current.isLoading).toBe(false);
  });

  it("reports a failed load with a retry", () => {
    const result = renderTokenOptions(undefined, false);

    expect(result.current.isError).toBe(true);
    result.current.retry();
    expect(refetch).toHaveBeenCalled();
  });
});
