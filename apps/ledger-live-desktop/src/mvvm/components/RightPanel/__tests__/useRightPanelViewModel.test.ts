import { getCryptoCurrencyById } from "@ledgerhq/live-common/currencies/index";
import { genAccount, genTokenAccount } from "@ledgerhq/ledger-wallet-framework/mocks/account";
import BigNumber from "bignumber.js";
import { renderHook } from "tests/testSetup";
import {
  buildDistributionItem,
  makeIntegrationTokenCurrency,
} from "tests/utils/distributionTestUtils";
import {
  DEFAULT_RIGHT_PANEL_VIEW_MODEL,
  getRightPanelRouteAssetId,
  useRightPanelViewModel,
} from "../useRightPanelViewModel";

jest.mock("~/renderer/actions/general", () => ({
  ...jest.requireActual("~/renderer/actions/general"),
  useDistribution: jest.fn(() => ({ bySlug: {}, list: [] })),
}));

const { useDistribution } = jest.requireMock("~/renderer/actions/general");

const btc = getCryptoCurrencyById("bitcoin");
const ethereum = getCryptoCurrencyById("ethereum");
const usdcToken = makeIntegrationTokenCurrency("ethereum/erc20/usd__coin", "USDC", "USD Coin");

describe("getRightPanelRouteAssetId", () => {
  it("returns undefined outside asset routes", () => {
    expect(getRightPanelRouteAssetId("/")).toBeUndefined();
    expect(getRightPanelRouteAssetId("/analytics")).toBeUndefined();
  });

  it("returns the route asset id on asset routes", () => {
    expect(getRightPanelRouteAssetId("/asset/bitcoin")).toBe("bitcoin");
    expect(getRightPanelRouteAssetId(`/asset/${usdcToken.id}`)).toBe(usdcToken.id);
  });
});

describe("useRightPanelViewModel", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    useDistribution.mockReturnValue({ bySlug: {}, list: [] });
  });

  describe("initialSwapState", () => {
    it("is undefined on asset route when distribution has no matching currency", () => {
      const { result } = renderHook(() =>
        useRightPanelViewModel({ pathname: "/asset/bitcoin", routeAssetId: "bitcoin" }),
      );

      expect(result.current.initialSwapState).toBeUndefined();
      expect(result.current.webviewKey).toBe("none::none");
    });

    it("builds swap state without account when distribution matches but no account exists", () => {
      const distributionItem = buildDistributionItem({ currency: btc, accounts: [] });

      useDistribution.mockReturnValue({
        bySlug: { bitcoin: distributionItem },
        list: [distributionItem],
      });

      const { result } = renderHook(() =>
        useRightPanelViewModel({ pathname: "/asset/bitcoin", routeAssetId: "bitcoin" }),
      );

      expect(result.current.initialSwapState).toEqual({
        defaultAmountFrom: "0",
        from: "/asset/bitcoin",
        defaultCurrency: { toCurrencyId: "bitcoin" },
      });
      expect(result.current.webviewKey).toBe("bitcoin::none");
    });

    it("preselects highest-balance account for a crypto currency", () => {
      const lowBalanceBtc = {
        ...genAccount("btc-low", { currency: btc }),
        balance: new BigNumber(1),
      };
      const highBalanceBtc = {
        ...genAccount("btc-high", { currency: btc }),
        balance: new BigNumber(100),
      };
      const distributionItem = buildDistributionItem({ currency: btc, accounts: [] });

      useDistribution.mockReturnValue({
        bySlug: { bitcoin: distributionItem },
        list: [distributionItem],
      });

      const { result } = renderHook(
        () => useRightPanelViewModel({ pathname: "/asset/bitcoin", routeAssetId: "bitcoin" }),
        { initialState: { accounts: [lowBalanceBtc, highBalanceBtc] } },
      );

      expect(result.current.initialSwapState).toEqual({
        defaultAmountFrom: "0",
        from: "/asset/bitcoin",
        defaultCurrency: { toCurrencyId: "bitcoin" },
        defaultAccountId: highBalanceBtc.id,
      });
      expect(result.current.initialSwapState?.defaultParentAccountId).toBeUndefined();
      expect(result.current.webviewKey).toBe(`bitcoin::${highBalanceBtc.id}`);
    });

    it("resolves parent account when preselected account is a token sub-account", () => {
      const ethAccount = genAccount("eth-1", { currency: ethereum });
      const tokenAccount = genTokenAccount(0, ethAccount, usdcToken);
      ethAccount.subAccounts = [tokenAccount];
      const distributionItem = buildDistributionItem({ currency: usdcToken, accounts: [] });

      useDistribution.mockReturnValue({
        bySlug: { [usdcToken.id]: distributionItem },
        list: [distributionItem],
      });

      const { result } = renderHook(
        () =>
          useRightPanelViewModel({
            pathname: `/asset/${usdcToken.id}`,
            routeAssetId: usdcToken.id,
          }),
        { initialState: { accounts: [ethAccount] } },
      );

      expect(result.current.initialSwapState).toEqual(
        expect.objectContaining({
          defaultAmountFrom: "0",
          from: `/asset/${usdcToken.id}`,
          defaultCurrency: { toCurrencyId: usdcToken.id },
          defaultAccountId: tokenAccount.id,
          defaultParentAccountId: ethAccount.id,
        }),
      );
      expect(result.current.webviewKey).toBe(`${usdcToken.id}::${tokenAccount.id}`);
    });
  });
});

describe("DEFAULT_RIGHT_PANEL_VIEW_MODEL", () => {
  it("provides an empty swap state for non-asset routes", () => {
    expect(DEFAULT_RIGHT_PANEL_VIEW_MODEL).toEqual({
      initialSwapState: undefined,
      webviewKey: "none::none",
    });
  });
});
