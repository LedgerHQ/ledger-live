import type { TokenCurrency } from "@domain/entity-currency-token";
import type { Account } from "@ledgerhq/types-live";
import { getXrpEnabledTokenStandards } from "@ledgerhq/live-common/families/xrp/config";
import { useTokensData } from "@features/platform-currencies";
import { renderHook } from "tests/testSetup";
import { filterTokenOptions, useTokenOptions } from "./useTokenOptions";
import {
  XRP_ACCOUNT,
  XRP_IOU_TOKEN_ACCOUNT,
  XRP_REMOVED_TOKEN_ACCOUNT,
} from "../__mocks__/account.mock";
import { xrpIouToken, xrpMptToken } from "../__mocks__/currency.mock";

jest.mock("@ledgerhq/live-common/families/xrp/config", () => ({
  ...jest.requireActual("@ledgerhq/live-common/families/xrp/config"),
  getXrpEnabledTokenStandards: jest.fn(),
}));
const mockGetXrpEnabledTokenStandards = jest.mocked(getXrpEnabledTokenStandards);
jest.mock("@features/platform-currencies", () => ({
  useTokensData: jest.fn(),
}));
const mockUseTokensData = jest.mocked(useTokensData);

const rlusd = xrpIouToken;
const usdc = { ...xrpIouToken, id: "ripple_testnet/iou/usdc" } as TokenCurrency;
const mpt = xrpMptToken;
const mainnetToken = {
  ...xrpIouToken,
  id: "ripple/iou/rlusd",
  parentCurrencyId: "ripple",
} as TokenCurrency;

const makeAccount = (subAccounts: Account["subAccounts"] = []): Account => ({
  ...XRP_ACCOUNT,
  subAccounts,
});

describe("filterTokenOptions", () => {
  beforeEach(() => {
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
  });

  it("keeps only the tokens of the account's network", () => {
    expect(filterTokenOptions([rlusd, mainnetToken], makeAccount())).toEqual([rlusd]);
  });

  it("keeps only the tokens whose standard is enabled", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou"]);

    expect(filterTokenOptions([rlusd, mpt], makeAccount())).toEqual([rlusd]);
  });

  it("lists nothing when no standard is enabled", () => {
    mockGetXrpEnabledTokenStandards.mockReturnValue([]);

    expect(filterTokenOptions([rlusd, mpt], makeAccount())).toEqual([]);
  });

  it("drops a held token but lists a removed one again", () => {
    const account = makeAccount([
      XRP_IOU_TOKEN_ACCOUNT,
      { ...XRP_REMOVED_TOKEN_ACCOUNT, token: usdc },
    ]);

    expect(filterTokenOptions([rlusd, usdc], account)).toEqual([usdc]);
  });
});

describe("useTokenOptions", () => {
  const account = makeAccount();
  const loadNext = jest.fn();
  const refetch = jest.fn();

  function renderTokenOptions(tokens: TokenCurrency[] | undefined, hasMore: boolean) {
    mockUseTokensData.mockReturnValue({
      data: tokens && { tokens, pagination: {} },
      isLoading: false,
      isError: !tokens,
      loadNext: hasMore ? loadNext : undefined,
      refetch,
    } as unknown as ReturnType<typeof useTokensData>);

    return renderHook(() => useTokenOptions(account)).result;
  }

  beforeEach(() => {
    jest.clearAllMocks();
    mockGetXrpEnabledTokenStandards.mockReturnValue(["iou", "mpt"]);
  });

  it("loads the next page while no loaded token fits the account", () => {
    const result = renderTokenOptions([mainnetToken], true);

    expect(loadNext).toHaveBeenCalledTimes(1);
    expect(result.current.isLoading).toBe(true);
  });

  it("waits for a scroll once a token fits the account", () => {
    const result = renderTokenOptions([rlusd, mainnetToken], true);

    expect(loadNext).not.toHaveBeenCalled();
    expect(result.current).toMatchObject({ options: [rlusd], isLoading: false });
  });

  it("ends the loading once no page is left", () => {
    const result = renderTokenOptions([mainnetToken], false);

    expect(result.current).toMatchObject({ options: [], isLoading: false });
  });

  it("reports a failed load with a retry", () => {
    const result = renderTokenOptions(undefined, false);

    expect(result.current.isError).toBe(true);
    result.current.retry();
    expect(refetch).toHaveBeenCalled();
  });
});
