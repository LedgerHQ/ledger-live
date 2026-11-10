import { act, renderHook } from "@testing-library/react";
import { track } from "@shared/analytics";
import { analyticsCatalog } from "../../analytics.mock";
import { useAnalyticsFiltersViewModel } from "./useAnalyticsFiltersViewModel";
import type { AnalyticsFiltersProps } from "./AnalyticsFilters.types";
import type { AnalyticsSelection } from "../../types";

jest.mock("@shared/analytics", () => ({ track: jest.fn() }));

beforeEach(() => jest.clearAllMocks());

const labels = {
  assets: "Asset filter",
  accounts: "Account filter",
  allAssets: "All assets",
  allAccounts: "All accounts",
};

function createProps(
  selection: AnalyticsSelection = { assetId: null, accountId: null, metric: "balance" },
): AnalyticsFiltersProps {
  return {
    assets: analyticsCatalog.assets,
    accounts: analyticsCatalog.accounts.filter(account => account.id !== "btc-account"),
    selection,
    labels,
    selectAsset: jest.fn(),
    selectAccount: jest.fn(),
  };
}

describe("useAnalyticsFiltersViewModel", () => {
  it("should list All assets first, then every asset with its icon", () => {
    const { result } = renderHook(() => useAnalyticsFiltersViewModel(createProps()));
    expect(result.current.asset).toMatchObject({
      ariaLabel: "Asset filter, All assets",
      value: "",
      triggerLabel: "All assets",
      selectedMeta: undefined,
      disabled: false,
    });
    expect(result.current.asset.items).toEqual([
      { value: "", label: "All assets" },
      { value: "eth", label: "Ethereum", meta: { iconId: "ethereum", ticker: "ETH" } },
      { value: "usdc", label: "USD Coin", meta: { iconId: "ethereum/erc20/usdc", ticker: "USDC" } },
      { value: "btc", label: "Bitcoin", meta: { iconId: "bitcoin", ticker: "BTC" } },
    ]);
  });

  it("should not offer the account filter until an asset is selected", () => {
    const { result } = renderHook(() => useAnalyticsFiltersViewModel(createProps()));
    expect(result.current.account).toBeNull();
  });

  it("should disable the asset filter while no asset is available", () => {
    const { result } = renderHook(() =>
      useAnalyticsFiltersViewModel({ ...createProps(), assets: [] }),
    );
    expect(result.current.asset.disabled).toBe(true);
    expect(result.current.asset.items).toEqual([{ value: "", label: "All assets" }]);
  });

  it("should describe the selected asset and account with their network", () => {
    const { result } = renderHook(() =>
      useAnalyticsFiltersViewModel(
        createProps({ assetId: "usdc", accountId: "tron-account", metric: "balance" }),
      ),
    );
    expect(result.current.asset).toMatchObject({
      value: "usdc",
      triggerLabel: "USD Coin",
      selectedMeta: { iconId: "ethereum/erc20/usdc", ticker: "USDC" },
    });
    expect(result.current.account).toMatchObject({
      ariaLabel: "Account filter, Savings",
      value: "tron-account",
      triggerLabel: "Savings",
      disabled: false,
    });
    expect(result.current.account?.items.map(item => item.meta?.networkName)).toEqual([
      undefined,
      "Ethereum",
      "Tron",
    ]);
  });

  it("should report a picked option and clear the selection for All", () => {
    const props = createProps({ assetId: "eth", accountId: "eth-account", metric: "balance" });
    const { result } = renderHook(() => useAnalyticsFiltersViewModel(props));
    act(() => result.current.asset.onValueChange("btc"));
    act(() => result.current.asset.onValueChange(""));
    act(() => result.current.account?.onValueChange("tron-account"));
    act(() => result.current.account?.onValueChange(null));
    expect(props.selectAsset).toHaveBeenNthCalledWith(1, "btc");
    expect(props.selectAsset).toHaveBeenNthCalledWith(2, null);
    expect(props.selectAccount).toHaveBeenNthCalledWith(1, "tron-account");
    expect(props.selectAccount).toHaveBeenNthCalledWith(2, null);
  });

  describe("tracking", () => {
    const ethAccountSelection: AnalyticsSelection = {
      assetId: "eth",
      accountId: "eth-account",
      metric: "balance",
    };

    it("should track nothing when the filters render a preselection", () => {
      renderHook(() => useAnalyticsFiltersViewModel(createProps(ethAccountSelection)));
      expect(track).not.toHaveBeenCalled();
    });

    it("should track each dropdown once when it opens and nothing when it closes", () => {
      const { result } = renderHook(() =>
        useAnalyticsFiltersViewModel(createProps(ethAccountSelection)),
      );
      act(() => result.current.asset.onOpenChange(true));
      act(() => result.current.asset.onOpenChange(false));
      act(() => result.current.account?.onOpenChange(true));
      act(() => result.current.account?.onOpenChange(false));
      expect(jest.mocked(track).mock.calls).toEqual([
        ["button_clicked", { button: "asset filter", page: "Analytics" }],
        ["button_clicked", { button: "account filter", page: "Analytics" }],
      ]);
    });

    it("should track the asset change with the asset names", () => {
      const { result } = renderHook(() =>
        useAnalyticsFiltersViewModel(createProps(ethAccountSelection)),
      );
      act(() => result.current.asset.onValueChange("btc"));
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("filter_changed", {
        filter: "Asset",
        page: "Analytics",
        value: "Bitcoin",
        previousValue: "Ethereum",
      });
    });

    it("should track the account change with the network names, never the account names", () => {
      const { result } = renderHook(() =>
        useAnalyticsFiltersViewModel(createProps(ethAccountSelection)),
      );
      act(() => result.current.account?.onValueChange("tron-account"));
      expect(track).toHaveBeenCalledTimes(1);
      expect(track).toHaveBeenCalledWith("filter_changed", {
        filter: "Account",
        page: "Analytics",
        value: "Tron",
        previousValue: "Ethereum",
      });
    });

    it("should track the All options with a locale-independent value", () => {
      const { result } = renderHook(() =>
        useAnalyticsFiltersViewModel(createProps(ethAccountSelection)),
      );
      act(() => result.current.account?.onValueChange(""));
      act(() => result.current.asset.onValueChange(""));
      expect(jest.mocked(track).mock.calls).toEqual([
        [
          "filter_changed",
          { filter: "Account", page: "Analytics", value: "all", previousValue: "Ethereum" },
        ],
        [
          "filter_changed",
          { filter: "Asset", page: "Analytics", value: "all", previousValue: "Ethereum" },
        ],
      ]);
    });

    it("should track nothing when the current option is picked again", () => {
      const props = createProps(ethAccountSelection);
      const { result } = renderHook(() => useAnalyticsFiltersViewModel(props));
      act(() => result.current.asset.onValueChange("eth"));
      act(() => result.current.account?.onValueChange("eth-account"));
      expect(track).not.toHaveBeenCalled();
      expect(props.selectAsset).not.toHaveBeenCalled();
      expect(props.selectAccount).not.toHaveBeenCalled();
    });

    it("should track nothing when a new asset resets the account filter", () => {
      const { rerender } = renderHook(
        (selection: AnalyticsSelection) => useAnalyticsFiltersViewModel(createProps(selection)),
        { initialProps: ethAccountSelection },
      );
      rerender({ assetId: "usdc", accountId: null, metric: "balance" });
      expect(track).not.toHaveBeenCalled();
    });
  });
});
