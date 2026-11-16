import { act, renderHook } from "@testing-library/react";
import type { CoinConfigToolProps } from "../../types";
import { useCoinConfigViewModel } from "./useCoinConfigViewModel";

const keys = ["config_currency_ethereum", "config_currency_solana", "config_nft_currencies"];

describe("useCoinConfigViewModel", () => {
  it("should start on the coin config keys, with totals per filter", () => {
    const { result } = renderViewModel({ overrides: { config_nft_currencies: [] } });

    expect(result.current.filteredKeys).toEqual([
      "config_currency_ethereum",
      "config_currency_solana",
    ]);
    expect(result.current.filterOptions).toEqual([
      { value: "coins", count: 2 },
      { value: "all", count: 3 },
      { value: "overridden", count: 1 },
    ]);
    expect(result.current.overrideCount).toBe(1);
  });

  it("should combine the filter and the search", () => {
    const { result } = renderViewModel();

    act(() => result.current.setFilter("all"));
    act(() => result.current.setSearch("NFT"));

    expect(result.current.filteredKeys).toEqual(["config_nft_currencies"]);
  });

  it("should ignore an unknown filter", () => {
    const { result } = renderViewModel();

    act(() => result.current.setFilter("enabled"));

    expect(result.current.filter).toBe("coins");
  });

  it("should describe a key from what the host resolves", () => {
    const { result } = renderViewModel({
      overrides: { config_currency_solana: { a: 1 } },
      getResolvedValue: key => (key === "config_currency_solana" ? { a: 1 } : undefined),
      getDefaultValue: () => ({ a: 0 }),
    });

    expect(result.current.getKeyDisplayState("config_currency_solana")).toEqual({
      key: "config_currency_solana",
      resolved: { a: 1 },
      defaultValue: { a: 0 },
      valueType: "object",
      isOverridden: true,
    });
  });

  it("should select and clear a key", () => {
    const { result } = renderViewModel();

    act(() => result.current.selectKey("config_currency_solana"));
    expect(result.current.selectedKey).toBe("config_currency_solana");

    act(() => result.current.clearSelection());
    expect(result.current.selectedKey).toBeNull();
  });
});

function renderViewModel(props: Partial<CoinConfigToolProps> = {}) {
  const fullProps: CoinConfigToolProps = {
    keys,
    overrides: {},
    getResolvedValue: () => undefined,
    getDefaultValue: () => undefined,
    setOverride: jest.fn(),
    clearOverride: jest.fn(),
    clearAllOverrides: jest.fn(),
    ...props,
  };
  return renderHook(() => useCoinConfigViewModel(fullProps));
}
