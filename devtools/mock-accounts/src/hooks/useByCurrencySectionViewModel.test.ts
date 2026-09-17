import { renderHook, act } from "@testing-library/react";
import { useByCurrencySectionViewModel } from "./useByCurrencySectionViewModel";

jest.mock("@ledgerhq/live-common/currencies/index", () => ({
  listSupportedCurrencies: () => [
    { id: "bitcoin", name: "Bitcoin", ticker: "BTC" },
    { id: "ethereum", name: "Ethereum", ticker: "ETH" },
    { id: "polkadot", name: "Polkadot", ticker: "DOT" },
  ],
}));

describe("useByCurrencySectionViewModel", () => {
  const makeOpts = (overrides = {}) => ({
    onGenerateByCurrency: jest.fn(),
    onGenerateEmpty: jest.fn(),
    ...overrides,
  });

  it("starts with empty selection and defaults", () => {
    const { result } = renderHook(() => useByCurrencySectionViewModel(makeOpts()));
    expect(result.current.selectedCount).toBe(0);
    expect(result.current.accountsPerCurrency).toBe(1);
    expect(result.current.filteredCurrencies).toHaveLength(3);
    expect(result.current.totalAccounts).toBe(0);
  });

  it("filters currencies by name", () => {
    const { result } = renderHook(() => useByCurrencySectionViewModel(makeOpts()));
    act(() => result.current.setCurrencySearch("bit"));
    expect(result.current.filteredCurrencies).toHaveLength(1);
    expect(result.current.filteredCurrencies[0].id).toBe("bitcoin");
  });

  it("filters currencies by ticker (case-insensitive)", () => {
    const { result } = renderHook(() => useByCurrencySectionViewModel(makeOpts()));
    act(() => result.current.setCurrencySearch("ETH"));
    expect(result.current.filteredCurrencies).toHaveLength(1);
    expect(result.current.filteredCurrencies[0].id).toBe("ethereum");
  });

  it("toggleCurrency adds then removes a currency", () => {
    const { result } = renderHook(() => useByCurrencySectionViewModel(makeOpts()));
    act(() => result.current.toggleCurrency("bitcoin"));
    expect(result.current.selectedIds.has("bitcoin")).toBe(true);
    expect(result.current.selectedCount).toBe(1);
    act(() => result.current.toggleCurrency("bitcoin"));
    expect(result.current.selectedIds.has("bitcoin")).toBe(false);
    expect(result.current.selectedCount).toBe(0);
  });

  it("selectAll selects all currently filtered currencies", () => {
    const { result } = renderHook(() => useByCurrencySectionViewModel(makeOpts()));
    act(() => result.current.setCurrencySearch("bit"));
    act(() => result.current.selectAll());
    expect(result.current.selectedCount).toBe(1);
    expect(result.current.selectedIds.has("bitcoin")).toBe(true);
  });

  it("clearSelection empties the selected set", () => {
    const { result } = renderHook(() => useByCurrencySectionViewModel(makeOpts()));
    act(() => {
      result.current.toggleCurrency("bitcoin");
      result.current.toggleCurrency("ethereum");
    });
    act(() => result.current.clearSelection());
    expect(result.current.selectedCount).toBe(0);
  });

  it("totalAccounts = selectedCount × accountsPerCurrency", () => {
    const { result } = renderHook(() => useByCurrencySectionViewModel(makeOpts()));
    act(() => {
      result.current.toggleCurrency("bitcoin");
      result.current.toggleCurrency("ethereum");
      result.current.setAccountsPerCurrency(5);
    });
    expect(result.current.totalAccounts).toBe(10);
  });

  it("handleByCurrency does nothing when selection is empty", () => {
    const onGenerateByCurrency = jest.fn();
    const { result } = renderHook(() =>
      useByCurrencySectionViewModel(makeOpts({ onGenerateByCurrency })),
    );
    act(() => result.current.handleByCurrency());
    expect(onGenerateByCurrency).not.toHaveBeenCalled();
  });

  it("handleByCurrency calls onGenerateByCurrency with correct args", () => {
    const onGenerateByCurrency = jest.fn();
    const { result } = renderHook(() =>
      useByCurrencySectionViewModel(makeOpts({ onGenerateByCurrency })),
    );
    act(() => {
      result.current.toggleCurrency("bitcoin");
      result.current.setAccountsPerCurrency(3);
      result.current.setTokenInput("ethereum/erc20/usd__coin, solana/spl/abc");
    });
    act(() => result.current.handleByCurrency());
    expect(onGenerateByCurrency).toHaveBeenCalledWith({
      currencyIds: ["bitcoin"],
      tokenIds: ["ethereum/erc20/usd__coin", "solana/spl/abc"],
      accountsPerCurrency: 3,
    });
  });

  it("handleGenerateEmpty does nothing when selection is empty", () => {
    const onGenerateEmpty = jest.fn();
    const { result } = renderHook(() =>
      useByCurrencySectionViewModel(makeOpts({ onGenerateEmpty })),
    );
    act(() => result.current.handleGenerateEmpty());
    expect(onGenerateEmpty).not.toHaveBeenCalled();
  });

  it("handleGenerateEmpty calls onGenerateEmpty with correct args", () => {
    const onGenerateEmpty = jest.fn();
    const { result } = renderHook(() =>
      useByCurrencySectionViewModel(makeOpts({ onGenerateEmpty })),
    );
    act(() => {
      result.current.toggleCurrency("ethereum");
      result.current.setAccountsPerCurrency(2);
    });
    act(() => result.current.handleGenerateEmpty());
    expect(onGenerateEmpty).toHaveBeenCalledWith({
      currencyIds: ["ethereum"],
      accountsPerCurrency: 2,
    });
  });

  it("tokenInput trims and lowercases token ids", () => {
    const onGenerateByCurrency = jest.fn();
    const { result } = renderHook(() =>
      useByCurrencySectionViewModel(makeOpts({ onGenerateByCurrency })),
    );
    act(() => {
      result.current.toggleCurrency("bitcoin");
      result.current.setTokenInput("  ETHEREUM/ERC20/USDC , , solana/spl/abc  ");
    });
    act(() => result.current.handleByCurrency());
    expect(onGenerateByCurrency).toHaveBeenCalledWith(
      expect.objectContaining({
        tokenIds: ["ethereum/erc20/usdc", "solana/spl/abc"],
      }),
    );
  });
});
